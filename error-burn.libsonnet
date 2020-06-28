{
  errorburn(param):: {
    local slo = {
      zones: [],
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
        { percent: '10', long: '1d', short: '2h', factor: 3, label: { priority: '3' } },
        { percent: '10', long: '3d', short: '6h', factor: 1, label: { priority: '4' } },
    ],

    alerts:
      [
        {
          alert: 'sentinel_%s_eb_%spercent_%s_slo%s' % [k.name, w.percent, w.long, param.availability],
          labels: w.label,
          annotations: {
            summary: '%s error budget burning fast for {{ $labels.zone_name }} in the last %s' % [k.name, w.long],
          },
          expr: |||
            (
            sum by (zone_name) (sum_over_time(sql_sentinel_%(kind)sstatus_1m{code=~"5..",zone_name=~"%(zones)s"}[%(long)s])/  ignoring(code) group_left() sum_over_time(sql_sentinel_l7ddos_1m{col="requests",zone_name=~"%(zones)s"}[%(long)s])) > (%(factor).2f * %(subtract).5f)
            and
            sum by (zone_name) (sum_over_time(sql_sentinel_%(kind)sstatus_1m{code=~"5..",zone_name=~"%(zones)s"}[%(short)s])/  ignoring(code) group_left() sum_over_time(sql_sentinel_l7ddos_1m{col="requests",zone_name=~"%(zones)s"}[%(short)s])) > (%(factor).2f * %(subtract).5f))
            (
          ||| % {
            kind: k.name,
            percent: w.percent,
            long: w.long,
            short: w.short,
            zones: std.join('|', slo.zones),
            subtract: 1 - slo.target,
            factor: w.factor,
          },
        },
       for k in kind
       for w in window
      ],
  },
}
