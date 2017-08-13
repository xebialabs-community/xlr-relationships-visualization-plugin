export default class GraphService {
    constructor ($http) {
        this._$http = $http;
    }

    get(releaseId) {
        return this._$http({
            url: 'api/extension/relationships/graph?id=Applications/' + releaseId,
            method: 'GET'
        }).then((res) => res.data.entity);
    }
}

GraphService.$inject = ["$http"];
