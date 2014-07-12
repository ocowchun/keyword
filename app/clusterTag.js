var tagInfo = require('../datas/academia/tags');
var _ = require('underscore');
var clusters = tagInfo.data;
exports.findCluster = findCluster;

function findCluster(id) {
	return _.find(clusters, function(cluster) {
		return cluster.id == id;
	})||{ id: id, tags: [] };
}
