
//TODO: Make this coffeeScript.
// Our area charts are always going to be time scales
//granularity = hour/day/week/month/year/ordinal
nv.models.stackedAreaChart = function(granularity) {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var stacked = nv.models.stackedArea()
    , xAxis = nv.models.axis(granularity)
    , yAxis = nv.models.axis('linear')
    ;

  var margin = {top: 30, right: 25, bottom: 50, left: 60}
    , width = null
    , height = null
    , color = nv.utils.defaultColor() // a function that takes in d, i and returns color
    , tooltips = true
    , keyFormatter = function (key) { return key; }
    , keyValueFormatter = function (d) { return d; }
    , tooltip = function(opts) {
        return '<h3>' + opts.key + '</h3>' +
               '<p>' +  opts.y + ' on ' + opts.x + '</p>'
      }
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , yAxisTickFormat = d3.format(',.2f')
    , state = { style: stacked.style() }
    , defaultState = null
    , noData = 'No Data Available.'
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'changeState')
    , controlWidth = 350
    , numTicks = null
    ;

  xAxis
    .orient('bottom')
    .tickPadding(7)
    ;
  yAxis
    .orient('left')
    ;
  stacked.scatter
    .pointActive(function(d) {
      return !!Math.round(stacked.y()(d) * 100);
    })
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var opts = {};

    opts.left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    opts.top = e.pos[1] + ( offsetElement.offsetTop || 0);
    opts.x = xAxis.tickFormat()(stacked.x()(e.point, e.pointIndex));
    opts.y = keyValueFormatter(stacked.y()(e.point, e.pointIndex));
    opts.chart = chart;
    opts.data = e.series;
    opts.event = e;
    var gravity  = e.value < 0 ? 'n' : 's'
    if (e.pointIndex === 0)
      gravity = 'w';
    else if (e.pointIndex === e.series.values.length -1)
      gravity = 'e';

    nv.tooltip.show([opts.left, opts.top], tooltip(opts), gravity, null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;

      chart.update = function() { return chart(selection) };
      chart.container = this;

      //set state.disabled
      state.disabled = data.map(function(d) { return !!d.disabled });

      if (!defaultState) {
        var key;
        defaultState = {};
        for (key in state) {
          if (state[key] instanceof Array)
            defaultState[key] = state[key].slice(0);
          else
            defaultState[key] = state[key];
        }
      }

      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Scales

      x = stacked.xScale();
      y = stacked.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-stackedAreaChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-stackedAreaChart').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-stackedWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');

      //------------------------------------------------------------

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      stacked
        .width(availableWidth)
        .height(availableHeight)

      var stackedWrap = g.select('.nv-stackedWrap')
          .datum(data);
      stackedWrap.call(stacked);

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Axes
      xAxis
        .scale(x)
        .chart(chart);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + availableHeight + ')')
          .call(xAxis);

      yAxis
        .scale(y)
        .setTickFormat(stacked.offset() === 'expand' ? d3.format('%') : yAxisTickFormat)
        .chart(chart)
        .axis.ticks(stacked.offset() === 'wiggle' ? 0 : Math.ceil(availableHeight/nv.utils.MAGIC_NUMBER));

      g.select('.nv-y.nv-axis')
          .call(yAxis)
      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------
      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      // Update chart from a state object passed to event handler
      dispatch.on('changeState', function(e) {

        if (typeof e.disabled !== 'undefined') {
          data.forEach(function(series,i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        if (typeof e.style !== 'undefined') {
          stacked.style(e.style);
        }

        selection.call(chart);
      });

    });


    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  stacked.dispatch.on('tooltipShow', function(e) {
    e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
    dispatch.tooltipShow(e);
  });

  stacked.dispatch.on('tooltipHide', function(e) {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.stacked = stacked;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, stacked, 'x', 'y', 'size', 'xScale', 'yScale', 'xDomain', 'yDomain', 'sizeDomain', 'interactive', 'offset', 'order', 'style', 'clipEdge', 'forceX', 'forceY', 'forceSize', 'interpolate');

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  //why isn't this just delegated to stacked.color, same for bar?
  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    stacked.color(color);
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.state = function(_) {
    if (!arguments.length) return state;
    state = _;
    return chart;
  };

  chart.defaultState = function(_) {
    if (!arguments.length) return defaultState;
    defaultState = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  yAxis.setTickFormat = yAxis.tickFormat;
  yAxis.tickFormat = function(_) {
    if (!arguments.length) return yAxisTickFormat;
    yAxisTickFormat = _;
    return yAxis;
  };

  chart.keyFormatter = function(_) {
    if (!arguments.length) return keyFormatter;
    keyFormatter = _;
    return chart;
  };
  chart.keyValueFormatter = function(_) {
    if (!arguments.length) return keyValueFormatter;
    keyValueFormatter = _;
    return chart;
  };
  //============================================================

  return chart;
}
