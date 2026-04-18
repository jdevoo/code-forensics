/*
 * code-forensics
 * Copyright (C) 2016-2021 Silvio Montanari
 * Distributed under the GNU General Public License v3.0
 * see http://www.gnu.org/licenses/gpl.html
 */

var _  = require('lodash'),
    d3 = require('d3');

var ForceDrag = require('./force_drag.js');

module.exports = function(options) {
  var simulation = d3.forceSimulation()
    .force('link', d3.forceLink()
      .id(function(node) { return node[options.nodeIdProperty]; })
      .distance(function() { return Math.min(options.width, options.height) / 4; })
      .strength(function(link) { return 1 / link[options.linkStrengthFactorProperty]; })
    )
    .force('charge', d3.forceManyBody()
      .strength(-200)
    )
    .force('collision', d3.forceCollide().radius(options.nodeRadius * 2))
    .force('x', d3.forceX(options.width / 2).strength(0.002))
    .force('y', d3.forceY(options.height / 2).strength(0.002))
    .force('center', d3.forceCenter(options.width / 2, options.height / 2));

  this.bindTo = function(charts, model) {
    var mainChart = _.find(charts, { 'name': 'main' });

    var nodesCount = model.graphData.nodes.length;
    simulation.nodes(model.graphData.nodes);
    
    // Adaptive repulsion: 
    // Small projects (e.g. 5 nodes) -> ~ -1000 strength
    // Large projects (e.g. 100 nodes) -> ~ -4000 strength
    // This scales with the square root to prevent excessive explosion while ensuring spread
    var adaptiveStrength = -400 * Math.sqrt(nodesCount + 1);
    simulation.force('charge').strength(adaptiveStrength);
    
    // Adaptive positioning force:
    // Fewer nodes need less gravity to stay centered, allowing them to spread.
    // More nodes need slightly more gravity to prevent the edges from leaking out too much.
    var adaptiveGravity = Math.min(0.05, 0.001 * Math.log10(nodesCount + 1));
    simulation.force('x').strength(adaptiveGravity);
    simulation.force('y').strength(adaptiveGravity);

    simulation.force('link').links(model.graphData.links);

    var allNodes = mainChart.getComponentByName('node-data').getElement().selectAll('circle');
    var allLinks = mainChart.getComponentByName('link-data').getElement().selectAll('line');

    if (options.allowDrag) {
      new ForceDrag(simulation).bindTo(allNodes);
    }

    simulation.on('tick', function() {
      allNodes
        .attr('cx', function(node) {
          node.x = Math.max(options.nodeRadius, Math.min(options.width - options.nodeRadius, node.x));
          return node.x;
        })
        .attr('cy', function(node) {
          node.y = Math.max(options.nodeRadius, Math.min(options.height - options.nodeRadius, node.y));
          return node.y;
        });
      allLinks
        .attr('x1', function(link) { return link.source.x; })
        .attr('y1', function(link) { return link.source.y; })
        .attr('x2', function(link) { return link.target.x; })
        .attr('y2', function(link) { return link.target.y; });
    });
  };
};
