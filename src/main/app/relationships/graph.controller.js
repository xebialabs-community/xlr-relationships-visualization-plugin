
export default class GraphController {
    constructor ($scope, $location, GraphService, $timeout, $window, $rootScope) {
        this.graphService = GraphService;
        this.errorMessage = "";
        this.chartObj = null;
        this.graphOptions = {};
        this.$timeout = $timeout;
        this.$window = $window;
        this.$location = $location;
        this.$rootScope = $rootScope;
        this.release =  $scope.releasePageExtensionCtrl.release;
        this.currentStart = "TEMPLATE" == this.release.status ? "template" : "release";
        this.layoutDirection = "LR";
        this.layoutAlign = "UL";
        this._initGraphConfig();
        this._initGraphOptions();
        this._initGraphData();
    }


    _initGraphConfig() {
        this.graphConfig = {
            theme:'default',
            event: [{click:(evt) => this._updateDragLayerPosition()}],
            dataLoaded:false
        };
    }


    layoutChanged() {
        this._layoutNodes({
            nodes: this.graphOptions.series[0].data,
            edges: this.graphOptions.series[0].links
        });
    }
    nodeClick(node) {
        let id = node.name.substring("Application/".length + 1);
        id = id.replace(/\//g, "-");
        let uri = id + "/relationships"
        uri = (node.kind === "template") ? "/templates/" + uri : "/releases/" + uri;
        this.$rootScope.$apply(() => {
            this.$location.path(uri);
        });
    }

    _updateDragLayerPosition() {
        this.chartObj.setOption({
            graphic: echarts.util.map(this.graphOptions.series[0].data, (item, dataIndex) => {
                return {
                    position: this.chartObj.convertToPixel({seriesIndex: 0}, [item.x, item.y])
                };
            })
        });
    }

    _initGraphData() {
        this.graphService.get(this.release.id).then((data) => {
            this._layoutNodes(data);
            this._updateGraphData(data.nodes, data.edges);
            this.$timeout(() => this._enableDragLayer(data.nodes), 500);
        }, (data) => {
            this.graphConfig.dataLoaded = true;
            this.errorMessage = "Failed to load data."
        });
    }

    _updateGraphData(nodes, edges) {
        const templateStyle = { color: "transparent", borderWidth: 2, borderColor: "#0099CC"};
        nodes.forEach((n) => {
                if (n.kind == "template") {
                    n.itemStyle = { normal: templateStyle, emphasis: templateStyle};
                    n.symbolSize= 28;
                } else {
                    n.itemStyle = { normal: { color: "#0099CC"}, emphasis: { color: "#0099CC"}};
                }
        });
        nodes[0].symbol = 'image:///static/7.0/relationships/img/pin.svg';
        nodes[0].itemStyle = { normal: { color: "#68B749"}, emphasis: { color: "#68B749"}};


        this.graphOptions.series[0].data = nodes;
        this.graphOptions.series[0].links = edges;
        this.graphConfig.dataLoaded = true;
    }

    _layoutNodes(data) {
        let g = new dagre.graphlib.Graph();
        g.setGraph({rankDir: this.layoutDirection, align: this.layoutAlign});
        g.setDefaultEdgeLabel(() => { return {} });
        data.nodes.forEach(n => {
            n.width = 50;
            n.height = 50;
            g.setNode(n.name, n);
        });

        data.edges.forEach(e => {
            e.lineStyle = {normal: {curveness: e.curve * 0.2}};
            g.setEdge(e.source, e.target);
        });
        dagre.layout(g);
    }

    _enableDragLayer(nodes) {
        const chart = this.chartObj;
        const updatePosition = () => this._updateDragLayerPosition();
        chart.setOption({
            graphic: echarts.util.map(nodes,  (item, dataIndex) => {
                return {
                    type: 'circle',
                    position: chart.convertToPixel({seriesIndex: 0}, [item.x, item.y]),
                    shape: { cx: 0, cy: 0, r: 24 / 2},
                    invisible: true,
                    draggable: true,
                    ondragend: updatePosition,
                    onclick: (e) => updatePosition,
                    ondblclick: (e) => this.nodeClick(item),
                    ondrag: echarts.util.curry(function(dataIndex, dx, dy) {
                        const coords = chart.convertFromPixel({seriesIndex: 0}, this.position);
                        nodes[dataIndex].x = coords[0];
                        nodes[dataIndex].y = coords[1];
                        chart.setOption({ series: [{ data: nodes }] });
                    }, dataIndex),
                    z: 100
                };
            })
        });

        this.$window.addEventListener('resize', updatePosition);

    }

    _initGraphOptions() {
        this.graphOptions = {
            tooltip: {
                show: false
            },
            animation: false,
            series: [{
                type: 'graph',
                layout: 'none',
                symbol: "circle",
                symbolSize: 30,
                roam: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [0, 8],
                focusNodeAdjacency: false,
                animation: false,
                edgeLabel: {
                    normal: {
                        show: true,
                        textStyle: {
                            color: "#999999",
                            fontSize: 10
                        },
                        formatter: function(params) {return params.data.label}
                    }
                },
                lineStyle: {
                    normal: {
                        color: "#DADADA",
                        opacity: 1,
                        width: 2,
                    }
                },
                label: {
                    normal: {
                        show: true,
                        formatter: function(params) {return params.data.label},
                        position: 'top',
                        textStyle: {
                            color: "#333",
                            fontSize: 10
                        }
                    }
                },
                data: [],
                links: []
            }]
        };
    }
}
