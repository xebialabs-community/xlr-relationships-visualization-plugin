
from com.xebialabs.deployit.exception import NotFoundException


class Node(object):

    def __init__(self, name, node_id, kind, status):
        self.name = name
        self.id = node_id
        self.kind = kind
        self.status = status


class Edge(object):

    def __init__(self, source_id, target_id, name, curve=0):
        self.source = source_id
        self.target = target_id
        self.name = name
        self.curve = curve
        self.cardinality = 1


class Graph(object):
    def __init__(self):
        self.processed_nodes = []
        self.nodes = []
        self.edges = []

    def add_edge(self, source_id, target_id, task_name):
        for e in self.edges:
            if e.source == source_id and e.target == target_id:
                e.cardinality += 1
                e.name = "%s, %s" % (e.name, task_name)
                return

        reverse_edge = None
        curve = 0
        for e in self.edges:
            if e.source == target_id and e.target == source_id:
                reverse_edge = e
        if reverse_edge is not None:
            curve = reverse_edge.curve + 1

        self.edges.append(Edge(source_id, target_id, task_name, curve))

    def add_node(self, name, node_id, kind, status):
        node = Node(name, node_id, kind, status)
        self.nodes.append(node)
        self.processed_nodes.append(node_id)
        return node

    def node_processed(self, nid):
        return nid in self.processed_nodes

    def to_dict(self):
        result_dict = {"nodes": [], "edges": []}
        for n in self.nodes:
            result_dict["nodes"].append({"name": n.id, "label": n.name, "kind": n.kind, "status": str(n.status)})
        for e in self.edges:
            result_dict["edges"].append({"source": e.source, "target": e.target, "label": e.name, "curve": e.curve,
                                  "cardinality": e.cardinality})
        return result_dict


def resolve_gate_release_id(plan_item_id):
    release_id_parts = []
    for p in plan_item_id.split("/"):
        if p.startswith("Phase"):
            break
        release_id_parts.append(p)
    return "/".join(release_id_parts)


def process_task(task, graph, node):
    if task.type in ["xlrelease.ParallelGroup", "xlrelease.SequentialGroup"]:
        process_tasks(task.tasks, graph, node)
    elif task.type == "xlrelease.CreateReleaseTask":
        if str(task.status) == "COMPLETED":
            graph.add_edge(node.id, task.createdReleaseId, task.title)
            analyse(task.createdReleaseId, graph)
        elif str(task.status) == "PLANNED":
            graph.add_edge(node.id, task.templateId, task.title)
            analyse(task.templateId, graph)
    elif task.type == "xlrelease.GateTask" and len(task.dependencies) > 0:
        for dep in task.dependencies:
            if dep.hasResolvedTarget():
                if dep.target is not None and dep.target.id is not None:
                    target_id = dep.target.id
                elif dep.targetId is not None:
                    target_id = dep.targetId
                else:
                    continue
                target_id = resolve_gate_release_id(target_id)
                graph.add_edge(node.id, target_id, task.title)
                analyse(target_id, graph)


def process_tasks(tasks, graph, node):
    [process_task(t, graph, node) for t in tasks]


def analyse(release_id, graph):
    if not graph.node_processed(release_id):
        release = read(release_id)
        kind = "template" if str(release.status) == "TEMPLATE" else "release"
        node = graph.add_node(release.title, release_id, kind, release.status)
        [process_tasks(p.tasks, graph, node) for p in release.phases]


def read(release_id):
    try:
        return templateApi.getTemplate(release_id)
    except NotFoundException:
        return releaseApi.getArchivedRelease(release_id)


rid = request.query["id"]
rid = rid.replace("-", "/")
result_graph = Graph()
analyse(rid, result_graph)

response.entity = result_graph.to_dict()


