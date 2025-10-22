WITH agg AS (
  SELECT
    d.Domain,
    d.application        AS Application,
    d.AutomationFrmk,
    SUM(COALESCE(d.NewAutoTC_Func, 0) + COALESCE(d.NewAutoTC_Reg, 0)) AS calc_sum
  FROM projecttccount_Design d
  GROUP BY d.Domain, d.AutomationFrmk, d.application
)
INSERT INTO masterautoinventory (
  Domain,
  Application,
  Package,
  AutomationFrmk,
  TotalAutoCount
)
SELECT
  a.Domain,
  a.Application,
  COALESCE(m.Package, '') AS Package,
  a.AutomationFrmk,
  COALESCE(m.TotalAutoCount_retro, 0) + a.calc_sum AS TotalAutoCount
FROM agg a
LEFT JOIN masterautoinventory m
  ON m.Domain = a.Domain
 AND m.Application = a.Application
 AND m.AutomationFrmk = a.AutomationFrmk
ON CONFLICT (Domain, Application, AutomationFrmk) DO UPDATE SET
  TotalAutoCount =
    COALESCE(masterautoinventory.TotalAutoCount_retro, 0)
    + (SELECT agg.calc_sum
       FROM agg
       WHERE agg.Domain = excluded.Domain
         AND agg.Application = excluded.Application
         AND agg.AutomationFrmk = excluded.AutomationFrmk);
