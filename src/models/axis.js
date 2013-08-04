// granularity = hour/day/week/month/ordinal
nv.models.axis = function(granularity) {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var axis = d3.svg.axis()
    ;

  var scale = scale || d3.time.scale()
    , isOrdinal = false
    , ticks = granularity || null
    , yLabelMargin = 35 // This is the amount the left margin to allocate to the use of labels.
    , theChart = null;
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
  var bottomMargin = null;

  //============================================================

  //TODO: Apply, clip labels, so they don't overwrite chart.
  function chart(selection) {
    if(bottomMargin === null){
      bottomMargin = bottomMargin || theChart && theChart.margin().bottom;
    }

    selection.each(function(data) {
      var container = d3.select(this);

      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-axis').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-axis');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      //------------------------------------------------------------
      //Setup the number of ticks
      if(axis.orient() === 'bottom'){
        switch (granularity){
          case 'ordinal':
            //Defaults are cool or ordinal axis.
            break;
          case 'hour':
            //TODO, here is where we decide how many to show.
            axis.ticks(d3.time.hours, 1)
            break;
          case 'day':
            axis.ticks(d3.time.days, 1)
            break;
          case 'week':
            axis.ticks(d3.time.mondays, 1)
            break;
          case 'month':
            axis.ticks(d3.time.months, 1)
            break;
          default:
            console.log('Unknown granularity for axis', granularity);
            return false;
        }
      }

      g.call(axis)

      var tickLabels = g.selectAll('g text')
        .classed('tick-label', true)
      var lines = g.selectAll('g .tick')

      function shouldRotate(){
        switch (granularity){
          case 'ordinal':
            return  shouldRotateOrdinal();
          case 'hour':
          case 'day':
          case 'week':
          case 'month':
            return shouldRotateTime();
          default:
            console.log('Unknown granularity for axis', granularity);
            return false;
        }
      }
      function shouldRotateOrdinal(){
        var wordWidth = d3.max(tickLabels.map(function(item, i){
          return nv.utils.calcApproxTextWidth(d3.select(this));
          }).data());
        var barWidth = scale.rangeBand()
        var shouldRotate = (wordWidth + 15)  >= barWidth
        var m = theChart.margin()
        if(shouldRotate) {
          axis.tickPadding(-5)
          //This 20, may seem magical, but I assure you it is mundane.
          // nv.utils.calcApproxTextWidth does not account for BOLDNESS, so we nudge it here.
          // TODO: patch nv.utils.calcApproxTextWidth to account for boldness, and remove the nudge
          m.bottom = wordWidth + 20
        }
        else{
          axis.tickPadding(7)
          m.bottom = bottomMargin || 0;
        }
        theChart.margin(m)
        return shouldRotate ? -90 : 0;
      }
      function shouldRotateTime(){
        var range = scale.range();
        var buffer = 20;
        var labelsWidth = buffer;
        tickLabels.each(function(d,i){
          labelsWidth +=  buffer + this.getBBox().width;
        });
        var wordWidth = 20 + tickLabels[0][0] && tickLabels[0][0].getBBox().width || 0;
        var chartWidth = range[range.length-1];
        var shouldRotate = labelsWidth >= chartWidth;
        var m = theChart.margin()
        //TODO: dy = .25 if rotated, .75 otherwise? Conirm visuals.
        if(shouldRotate) {
          axis.tickPadding(-5)
          //This 20, may seem magical, but I assure you it is mundane.
          // nv.utils.calcApproxTextWidth does not account for BOLDNESS, so we nudge it here.
          // TODO: patch nv.utils.calcApproxTextWidth to account for boldness, and remove the nudge
          m.bottom = wordWidth + 20
        }
        else{
          axis.tickPadding(7)
          m.bottom = bottomMargin || 0;
        }
        theChart.margin(m)
        return shouldRotate ? -90 : 0;
      }
      function intersectRect(r1, r2) {
        return !(r2.left > r1.right ||
                 r2.right < r1.left ||
                 r2.top > r1.bottom ||
                 r2.bottom < r1.top);
      }
      function shouldHide(rotate){
        // We only need to hide if we rotate.
        if(!rotateLabels) return;

        var prevRect = null;
        var prevText = null;

        tickLabels.each(function(d, i){
          var hide = false;
          var rect = this.getBoundingClientRect();

          if(i === 0){
            prevRect = this.getBoundingClientRect();
            prevText = this;
            d3.select(this).classed('no-show', false);
            return;
          }

          if(prevRect){
            hide = intersectRect(prevRect, rect);
            d3.select(this).classed('no-show', hide);
            if(!hide){
              prevText = this;
              prevRect = rect;
            }
          }
        });
      }
      //TODO: Make an X Axis, YAxis it will make it cleaner and leaner.
      //ADDR: Axis.orient has nothing to do with where the axis is located.  It just about where to place the labels wrt to the line.
      switch (axis.orient()) {

        case 'bottom':

          var xLabelMargin = 36;
          var maxTextWidth = 30;

          //Calculate the longest xTick width
          tickLabels.each(function(d,i){
            var width = this.getBBox().width;
            if(width > maxTextWidth) maxTextWidth = width;
          });

          var rotateLabels = shouldRotate() || 0;

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

          shouldHide(rotateLabels);

          break;
        case 'left':
          tickLabels
            .attr('x', function(d){return -yLabelMargin;})
            .attr('text-anchor', 'start');
          lines
            .attr('x1', -10000)
            .attr('x2', 10000);


          //Put boxes around things, but only if we need to.
          g.selectAll('g').each(function(d, thing){
            var buffer = 8;
            var group = d3.select(this);
            var text = group.select('.tick-label');
            var SVGRect = text[0][0].getBBox();
            var rect = group.select('.nvd3-text-background');
            if(!rect[0][0]){
             rect =  group.insert("rect", '.tick-label')
              .classed("nvd3-text-background", true)
              .attr("width", SVGRect.width + 2 * buffer)
              .attr("height", SVGRect.height);
            }
            rect.attr("x", SVGRect.x - buffer )
            .attr("y", SVGRect.y)

          });
          break;
      }

      //Make sure we're showing a top and bottom axis.


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

  chart.chart = function(_) {
    if (!arguments.length) return theChart;
    theChart = _;
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

  chart.yLabelMargin = function(_) {
    if(!arguments.length) return yLabelMargin;
    yLabelMargin = _;
    return chart;
  }

  //============================================================


  return chart;
}
