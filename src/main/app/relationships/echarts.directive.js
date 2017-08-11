
export default function EChart(){
    'ngInject';

    return {
        scope:{
            option:'=ecOption',
            config:'=ecConfig',
            chartObj: '=?ecChart'
        },
        restrict:'EA',

        link: function(scope,element,attrs,ctrl) {

            function refreshChart() {
                console.log("here", scope.config);
                const theme = (scope.config && scope.config.theme) ? scope.config.theme : 'default';
                let chart = scope.chartObj;
                if (chart === undefined ||  chart === null) {
                    chart = echarts.init(element[0], theme);
                }

                if(scope.config && scope.config.dataLoaded === false){
                    chart.showLoading();
                }

                if(scope.config && scope.config.dataLoaded){
                    chart.setOption(scope.option);
                    chart.resize();
                    chart.hideLoading();
                }

                if(scope.config && scope.config.event){
                    if(angular.isArray(scope.config.event)){
                        angular.forEach(scope.config.event,function(value, key){
                            for(const e in value){
                                chart.on(e,value[e]);
                            }
                        });
                    }
                }
                scope.chartObj = chart;
            }


            scope.$watch(
                function () { return scope.config; },
                function (value) {if (value) {refreshChart();}},
                true
            );

            scope.$watch(
                function () { return scope.option; },
                function (value) {if (value) {refreshChart();}},
                true
            );
        }

    }
}