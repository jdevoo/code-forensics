/*
 * code-forensics
 * Copyright (C) 2016-2021 Silvio Montanari
 * Distributed under the GNU General Public License v3.0
 * see http://www.gnu.org/licenses/gpl.html
 */

var d3Cloud  = require('d3-cloud'),
    Bluebird = require('bluebird'),
    _        = require('lodash');

module.exports = function(options) {
  var layout = d3Cloud.layout.cloud();

  this.toSeries = function(data) {
    var maxCount = _.maxBy(data, function(word) { return word.count; }).count;

    var series = _.map(data, function(word) {
      return { text: word.text, count: word.count, size: word.count/maxCount * 100 };
    });

    return new Bluebird(function(resolve) {
      layout.words(series)
        .size([options.width, options.height])
        .font('Arial Black, sans-serif')
        .fontSize(function(word) { return word.size; })
        .padding(options.wordPadding)
        .on('end', function(outputSeries) {
          if (outputSeries.length > 0) {
            var xMin = _.minBy(outputSeries, 'x').x;
            var xMax = _.maxBy(outputSeries, 'x').x;
            var yMin = _.minBy(outputSeries, 'y').y;
            var yMax = _.maxBy(outputSeries, 'y').y;
            var width = xMax - xMin;
            var height = yMax - yMin;
            var scale = Math.min(options.width / width, options.height / height) * 0.9;
            var xOffset = (xMin + xMax) / 2;
            var yOffset = (yMin + yMax) / 2;
            _.each(outputSeries, function(d) {
              d.x = (d.x - xOffset) * scale;
              d.y = (d.y - yOffset) * scale;
              d.size *= scale;
            });
          }
          resolve(outputSeries);
        })
        .start();
    });
  };
};
