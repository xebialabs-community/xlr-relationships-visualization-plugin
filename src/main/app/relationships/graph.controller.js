
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
        this.lastUpdated = new Date();
        this.release =  $scope.releasePageExtensionCtrl.release;
        this.currentStart = "TEMPLATE" == this.release.status ? "template" : "release";
        this.settings = {layoutDirection: "LR", layoutAlign: "UL", showTitle: true, showLabel: true};
        this._loadSettings();
        this._initGraphConfig();
        this._initGraphOptions();
        this.initGraphData();
    }


    _initGraphConfig() {
        this.graphConfig = {
            theme:'default',
            event: [{click:(evt) => this._updateDragLayerPosition()}],
            dataLoaded:false
        };
    }

    zoomIn() {
        this.chartObj._chartsViews[0]._controller.trigger('zoom', 1/1.1, 750, 300);
    }

    zoomOut() {
        this.chartObj._chartsViews[0]._controller.trigger('zoom', 1.1, 750, 300);
    }

    layoutChanged() {
        this._saveSettings();
        this._layoutNodes({
            nodes: this.graphOptions.series[0].data,
            edges: this.graphOptions.series[0].links
        });
    }

    showHideLabels() {
        this._saveSettings();
        this.chartObj.setOption({
            series: [{
                edgeLabel: { normal: {show: this.settings.showLabel}},
                label: { normal: {show: this.settings.showTitle}}
            }]
        });
    }

    nodeClick(node, routeToRelationshipsView) {
        let id = node.name.substring("Application/".length + 1);
        id = id.replace(/\//g, "-");
        let uri = routeToRelationshipsView ? id + "/relationships" : id + "/table";
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

    initGraphData() {
        this.graphService.get(this.release.id).then((data) => {
            this._layoutNodes(data);
            this._updateGraphData(data.nodes, data.edges);
            this.lastUpdated = new Date();
            this.$timeout(() => this._enableDragLayer(data.nodes), 500);
        }, (data) => {
            this.graphConfig.dataLoaded = true;
            this.lastUpdated = new Date();
            this.errorMessage = "Failed to load data. See server logs for details."
        });
    }

    _updateGraphData(nodes, edges) {
        const templateStyle = { color: "transparent", borderWidth: 2, borderColor: "#0099CC"};
        nodes.forEach((n) => {
                if (n.kind == "template") {
                    n.itemStyle = { normal: templateStyle, emphasis: templateStyle};
                    n.symbolSize= 28;
                } else if (n.status == "FAILING" || n.status == "FAILED" || n.status == "ABORTED") {
                    n.itemStyle = { normal: { color: "#A94442"}, emphasis: { color: "#A94442"}};
                } else if (n.status == "COMPLETED") {
                    n.itemStyle = { normal: { color: "#5DAE3F"}, emphasis: { color: "#5DAE3F"}};
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
        g.setGraph({rankDir: this.settings.layoutDirection, align: this.settings.layoutAlign});
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
                    ondblclick: (e) => this.nodeClick(item, e.event.shiftKey),
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

    _loadSettings() {
        let item = this.$window.sessionStorage.getItem("relationships_settings");
        if (item) {
            this.settings = JSON.parse(item);
        }
    }

    _saveSettings() {
        this.$window.sessionStorage.setItem("relationships_settings", JSON.stringify(this.settings));
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
                        show: this.settings.showLabel,
                        textStyle: {
                            color: "#999999",
                            fontSize: 10
                        },
                        formatter: function(params) {return params.data.displayLabel}
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
                        show: this.settings.showTitle,
                        formatter: function(params) {return params.data.displayLabel},
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
