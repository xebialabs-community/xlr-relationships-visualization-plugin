
import GraphService from "./graph.service"
import GraphController from "./graph.controller"
import ECharts from "./echarts.directive"

export default angular.module('relationships.graph', [])
    .service('GraphService', GraphService)
    .controller("GraphController", GraphController)
    .directive('eCharts', ECharts)
    .name
