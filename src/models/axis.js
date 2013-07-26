// granularity = hour/day/week/month/ordinal
nv.models.axis = function(granularity) {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var axis = d3.svg.axis()
    ;

  var scale = scale || d3.time.scale()
    , rotateLabels = 0
    , isOrdinal = false
    , ticks = granularity || null
    , yLabelMargin = 35 // This is the amount the left margin to allocate to the use of labels.
    , first = true
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
    //var wordWidth = _.max _.map angular.element(".nv-x text"), (item, i) ->
          //   nv.utils.calcApproxTextWidth d3.select item

          // barWidth = Number angular.element(".nv-bar").attr("width")
          // shouldRotate = wordWidth >= barWidth
          // m = chart.margin()
          // if chart.rotateLabels
          //   if shouldRotate
          //     chart.xAxis.tickPadding(-5)
          //     chart.rotateLabels(-90)
          //     #This 20, may seem magical, but I assure you it is mundane.
          //     # nv.utils.calcApproxTextWidth does not account for BOLDNESS, so we nudge it here.
          //     # TODO: patch nv.utils.calcApproxTextWidth to account for boldness, and remove the nudge
          //     m.bottom = wordWidth + 20
          //   else
          //     chart.xAxis.tickPadding(7)
          //     chart.rotateLabels(0)
          //     m.bottom = bottomMargin
          // chart.margin m
  }
  function shouldRotateTime(){}

  //TODO: Apply, clip labels, so they don't overwrite chart.
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

          //TODO: Should Rotate?
          shouldRotate();

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

          break;
        case 'left':
          tickLabels
            .attr('x', function(d){return -yLabelMargin;})
            .attr('text-anchor', 'start');
          lines
            .attr('x1', -10000)
            .attr('x2', 10000)

          //Put boxes around things, but only once.
          //TODO: figure out how to do this without first variable, this will be better
          if(first){
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
          }
          first = false;
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


  chart.ticks = function(_) {
    if (!arguments.length) return ticks;
    ticks = _;
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
