
export default class GraphController {
    constructor (GraphService, $timeout, $window) {
        this.graphService = GraphService;
        this.errorMessage = "";
        this.chartObj = null;
        this.graphOptions = {};
        this.$timeout = $timeout;
        this.$window = $window;
        this._initGraphConfig();
        this._initGraphOptions();
        this._initGraphData();
    }

    _initGraphConfig() {
        this.graphConfig = {
            theme:'default',
            event: [{click:(evt) => this.graphClick(evt)}],
            dataLoaded:false
        };
    }


    graphClick(evt) {
        console.log(evt);
        this._updateDragLayerPosition();
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
        this.graphService.get("Release474169433").then((data) => {
            this._layoutNodes(data);
            this._updateGraphData(data.nodes, data.edges);
            this.$timeout(() => this._enableDragLayer(data.nodes), 500);
        }, (data) => {
            this.graphConfig.dataLoaded = true;
            this.errorMessage = "Failed to load data."
        });
    }

    _updateGraphData(nodes, edges) {
        nodes[0].symbol = "diamond";
        nodes[0].itemStyle = { normal: { color: "#009800"}, emphasis: { color: "#009800"}};
        this.graphOptions.series[0].data = nodes;
        this.graphOptions.series[0].links = edges;
        this.graphConfig.dataLoaded = true;
    }

    _layoutNodes(data) {
        let g = new dagre.graphlib.Graph();
        g.setGraph({rankDir: "LR", align: "UR"});
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
                    onclick: (e) => this.graphClick(e),
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
                show: true,
                triggerOn: "click"
            },
            animation: false,
            series: [{
                type: 'graph',
                layout: 'none',
                symbol: "circle",
                symbolSize: 30,
                roam: true,
                edgeSymbol: ['circle', 'arrow'],
                edgeSymbolSize: [0, 10],
                focusNodeAdjacency: false,
                animation: false,
                tooltip: {
                    show: true,
                    formatter: function(params) {
                        if (params.data.hasOwnProperty("cardinality")) {
                            if (params.data.cardinality > 1) {
                                return "triggered " + params.data.cardinality + " times";
                            }
                        }
                        return params.data.label;
                    },
                    textStyle: {
                        fontSize: 12
                    }
                },
                itemStyle: {
                    normal: {
                        color: "#4592FF",
                    },
                    emphasis: {
                        color: "#4592FF"
                    }
                },
                edgeLabel: {
                    normal: {
                        show: true,
                        textStyle: {
                            fontSize: 10
                        },
                        formatter: function(params) {return params.data.label}
                    }
                },
                lineStyle: {
                    normal: {
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
