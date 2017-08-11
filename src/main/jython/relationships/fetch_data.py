

class TemplateNode(object):
    def __init__(self, name, template_id):
        self.name = name
        self.template_id = template_id
        self.x = 0
        self.y = 0


class TemplateEdge(object):
    def __init__(self, source_template_id, target_template_id, name, curve=0):
        self.source = source_template_id
        self.target = target_template_id
        self.name = name
        self.curve = curve
        self.cardinality = 1

    def __eq__(self, other):
        """Override the default Equals behavior"""
        if isinstance(other, self.__class__):
            return self.__dict__ == other.__dict__
        return False

    def __ne__(self, other):
        """Define a non-equality test"""
        return not self.__eq__(other)



class TemplateGraph(object):
    def __init__(self):
        self.processed_nodes = []
        self.nodes = []
        self.edges = []

    def add_edge(self, source_template_id, target_template_id, task_name):
        for e in self.edges:
            if e.source == source_template_id and e.target == target_template_id:
                e.cardinality += 1
                e.name = "%s, %s" % (e.name, task_name)
                return

        reverse_edge = None
        curve = 0
        for e in self.edges:
            if e.source == target_template_id and e.target == source_template_id:
                reverse_edge = e
        if reverse_edge is not None:
            curve = reverse_edge.curve + 1

        self.edges.append(TemplateEdge(source_template_id, target_template_id, task_name, curve))

    def add_node(self, name, template_id):
        node = TemplateNode(name, template_id)
        self.nodes.append(node)
        self.processed_nodes.append(template_id)
        return node

    def node_processed(self, template_id):
        return template_id in self.processed_nodes

    def to_dict(self):
        dict = {"nodes": [], "edges": []}
        for n in self.nodes:
            dict["nodes"].append({"name": n.template_id, "label": n.name, "x": n.x, "y": n.y})
        for e in self.edges:
            dict["edges"].append({"source": e.source, "target": e.target, "label": e.name, "curve": e.curve,
                                  "cardinality": e.cardinality})
        return dict



def process_task(task, graph, node):
    if task.type in ["xlrelease.ParallelGroup", "xlrelease.SequentialGroup"]:
        process_tasks(task.tasks, graph, node)
    elif task.type == "xlrelease.CreateReleaseTask":
        graph.add_edge(node.template_id, task.templateId, task.title)
        analyse_template(task.templateId, graph)


def process_tasks(tasks, graph, node):
    [process_task(t, graph, node) for t in tasks]


def analyse_template(template_id, graph):
    if not graph.node_processed(template_id):
        template = templateApi.getTemplate(template_id)
        node = graph.add_node(template.title, template_id)
        [process_tasks(p.tasks, graph, node) for p in template.phases]


#releaseId = request.query['releaseId']

template_id=request.query["templateId"]
graph = TemplateGraph()
analyse_template(template_id, graph)

response.entity=graph.to_dict()


