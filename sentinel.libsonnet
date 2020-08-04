{
  alerts(param):: {
    local slo = {
      target:
        if std.objectHas(param, 'errorBudget') then
          1 - param.errorBudget
        else
          error 'must set target for error burn',
    } + param,

    local kind = [
      { name: 'edge'},
      { name: 'origin'},
    ],

    local window = [
        { percent: '2', long: '1h', short: '5m', factor: 14.4, label: { priority: '1', notify: 'chat-sentinel-poc' } },
        { percent: '5', long: '6h', short: '30m', factor: 6, label: { priority: '2' } },
        { percent: '10', long: '24h', short: '2h', factor: 3, label: { priority: '3' } },
        { percent: '10', long: '3d', short: '6h', factor: 1, label: { priority: '4' } },
    ],

    latency_originrtt:
     [
      {
        alert: 'sentinel_originrtt_%s' % [slo.zone],
        labels: { 
            priority: '4', 
            notify: 'chat-sentinel-poc escalate-sentinel-production' 
        },
        'for': '3m',
        annotations: {
            summary: ' Increase in Origin RTT for {{ $labels.zone_name }}',
        },
        expr: |||
          (avg_over_time(sql_sentinel_originrtt_1m{zone_name="%(zone)s"}[5m]) > %(originrtt)s) AND (avg_over_time(sql_sentinel_originrtt_1m{zone_name="%(zone)s"}[6h]) < %(originrtt)s)
        ||| % {
          originrtt: slo.originrtt,
          zone: slo.zone,
        },
      }
    ],

    latency_ttfb:
     [
      {
        alert: 'sentinel_ttfb_%s' % [slo.zone],
        labels: { 
            priority: '4', 
            notify: 'chat-sentinel-poc escalate-sentinel-production' 
        },
        'for': '3m',
        annotations: {
            summary: ' Increase in TTFB for {{ $labels.zone_name }}',
        },
        expr: |||
          (avg_over_time(sql_sentinel_ttfb_1m{zone_name="%(zone)s"}[5m]) > %(ttfb)s) AND (avg_over_time(sql_sentinel_ttfb_1m{zone_name="%(zone)s"}[6h]) < %(ttfb)s)
        ||| % {
          ttfb: slo.ttfb,
          zone: slo.zone,
        },
      }
    ],

    attack:
     [
      {
        alert: 'sentinel_l7ddos_%s' % [slo.zone],
        labels: { 
            priority: '4', 
            notify: 'chat-sentinel-poc escalate-sentinel-production' 
        },
        'for': '3m',
        annotations: {
            summary: ' Increase in L7 DDoS attack for {{ $labels.zone_name }}',
        },
        expr: |||
          sql_sentinel_l7ddos_1m{col="l7ddos",zone_name="%(zone)s"} > 100
        ||| % {
          zone: slo.zone,
        },
      }
    ],

    traffic:
     [
      {
        alert: 'sentinel_traffic_%s' % [slo.zone],
        labels: { 
            priority: '1', 
            notify: 'chat-sentinel-poc escalate-sentinel-production' 
        },
        annotations: {
            summary: ' Drop in Traffic for {{ $labels.zone_name }}',
        },
        expr: |||
          (avg_over_time(sql_sentinel_l7ddos_1m{zone_name="%(zone)s",col="requests"}[3m]) / (sql_sentinel_l7ddos_1m{zone_name="%(zone)s",col="requests"})) > %(threshold)s
        ||| % {
          threshold: slo.threshold,
          zone: slo.zone,
        },
      }
    ],

    errorburn:
      [
        {
          alert: 'sentinel_%s_%spct_slo%s_%s' % [k.name, w.percent, param.availability, slo.zone],
          labels: w.label,
          annotations: {
            summary: ' %s error budget burning fast for {{ $labels.zone_name }} in the last %s' % [k.name, w.long],
          },
          expr: |||
            (
            sum by (zone_name) (sum_over_time(sql_sentinel_%(kind)sstatus_1m{code=~"5..",zone_name=~"%(zone)s"}[%(long)s])/  ignoring(code) group_left() sum_over_time(sql_sentinel_l7ddos_1m{col="requests",zone_name=~"%(zone)s"}[%(long)s])) > (%(factor).2f * %(subtract).5f)
            and
            sum by (zone_name) (sum_over_time(sql_sentinel_%(kind)sstatus_1m{code=~"5..",zone_name=~"%(zone)s"}[%(short)s])/  ignoring(code) group_left() sum_over_time(sql_sentinel_l7ddos_1m{col="requests",zone_name=~"%(zone)s"}[%(short)s])) > (%(factor).2f * %(subtract).5f))
            (
          ||| % {
            kind: k.name,
            percent: w.percent,
            long: w.long,
            short: w.short,
            zone: slo.zone,
            subtract: 1 - slo.target,
            factor: w.factor,
          },
        },
       for k in kind
       for w in window
      ],
  },
}
