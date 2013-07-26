nv.models.axis = function(margin, granularity) {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var axis = d3.svg.axis()
    ;

  var margin = {top: 0, right: 0, bottom: 0, left: 0}//chart.margin() // Top/bottom, it's chart.margin, else it can have it own margin?
    , scale = scale || d3.scale.linear()
    , rotateLabels = 0
    , isOrdinal = false
    , isTIme = false
    , ticks = granularity || null
    , yLabelMargin = 35 // This is the amount the left margin to allocate to the use of labels.
    ;

  axis
    .scale(scale)
    .orient('bottom')
    .tickFormat(function(d) { return d })
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------


  //============================================================

  //TODO: Make an X Axis, YAxis it will make it cleaner and leaner.
  //TODO: Clip labels, so they don't overwrite chart.
  function chart(selection) {

    selection.each(function(data) {
      var container = d3.select(this);


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-axis').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-axis');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      //------------------------------------------------------------
      //TODO:  THis sucks, use something better. isOrdinal, isTime
      if (ticks !== null)
        axis.ticks(ticks);
      else if (axis.orient() == 'top' || axis.orient() == 'bottom')
        axis.ticks(Math.abs(scale.range()[1] - scale.range()[0]) / 100 + 10);

      // Make the axis.
      g.call(axis)

      var tickLabels = g.selectAll('g text')
        .classed('tick-label', true)
      var lines = g.selectAll('g .tick')

      //ADDR: Axis.orient has nothing to do with where the axis is located.  It just about where to place the labels wrt to the line.
      switch (axis.orient()) {
        // case 'top':
        //   break;
        case 'bottom':
          var xLabelMargin = 36;
          var maxTextWidth = 30;

          //Calculate the longest xTick width
          tickLabels.each(function(d,i){
            var width = this.getBBox().width;
            if(width > maxTextWidth) maxTextWidth = width;
          });

          var anchor = 'middle';
          if(rotateLabels === 0){
            anchor = 'middle'
            xTranslate = 0
          }else{
            anchor = rotateLabels%360 > 0 ? 'start' : 'end'
            xTranslate = -5
          }

          //Convert to radians before calculating sin. Add 30 to margin for healthy padding.
          var sin = Math.abs(Math.sin(rotateLabels*Math.PI/180));
          var xLabelMargin = (sin ? sin*maxTextWidth : maxTextWidth)+30;

          tickLabels
            .attr('transform', function(d,i,j) { return 'rotate(' + (rotateLabels) + ',0,0), translate('+(xTranslate)+',0)' })
            .attr('text-anchor', anchor);

          //Start and end get labels get start, end, rest get middle if no rotate
          // if (rotateLabels === 0){
          //   first = d3.select(tickLabels[0][0])
          //     .attr('text-anchor', 'start')
          //   };
          break;
        // case 'right':
        //   lines
        //     .attr('x1', -10000)
        //     .attr('x2', 10000)
        //   tickLabels.attr('text-anchor', 'end');
        case 'left':
          tickLabels.attr('x', function(d){
            return -yLabelMargin;
          })
          lines
            .attr('x1', -10000)
            .attr('x2', 10000)
          tickLabels.attr('text-anchor', 'start');
          break;
      }

      //Make sure we're showing a top and bottom axis.

      //Put boxes around things.
      g.selectAll('g').each(function(d, thing){
        var buffer = 1;
        var group = d3.select(this);
        var text = group.select('.tick-label');
        var SVGRect = text[0][0].getBBox();
        var rect = group.insert("rect", '.tick-label');
        rect.attr("class", "nvd3-text-background")
        .attr("x", SVGRect.x - buffer )
        .attr("y", SVGRect.y)
        .attr("width", SVGRect.width + 2 * buffer)
        .attr("height", SVGRect.height)
      });
      //highlight zero line ... Maybe should not be an option and should just be in CSS?
      //TODO: Just select the [first one?]
        g.selectAll('line.tick')
          .filter(function(d) { return !parseFloat(Math.round(d*100000)/1000000) }) //this is because sometimes the 0 tick is a very small fraction, TODO: think of cleaner technique
            .classed('zero', true);
    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.axis = axis;

  d3.rebind(chart, axis, 'orient', 'tickValues', 'tickSubdivide', 'tickSize', 'tickPadding', 'tickFormat');
  d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands'); //these are also accessible by chart.scale(), but added common ones directly for ease of use


  chart.ticks = function(_) {
    if (!arguments.length) return ticks;
    ticks = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
    axis.scale(scale);
    isOrdinal = typeof scale.rangeBands === 'function';
    d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands');
    return chart;
  }

  chart.rotateLabels = function(_) {
    if(!arguments.length) return rotateLabels;
    rotateLabels = _;
    return chart;
  }


  chart.yLabelMargin = function(_) {
    if(!arguments.length) return yLabelMargin;
    yLabelMargin = _;
    return chart;
  }

  //============================================================


  return chart;
}
