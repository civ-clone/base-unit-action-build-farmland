# base-unit-action-build-farmland

The `BuildFarmland` unit action: a delayed action that builds `Farmland` (`base-tile-improvement-farmland`) on the
unit's own tile, which is already irrigated. The `Irrigation` stays: the tile then has both.

- `BuildFarmland`: `new BuildFarmland(from, to, unit, ruleRegistry?, turn?, pendingEffects?)`. `perform()` starts the
  work, for as many turns as the largest `MovementCost` answer for the action, divided by the unit's `WorkRate`
  (core-unit's `DelayedAction`), and puts the unit in the `BuildingFarmland` busy state. When the work comes due,
  `BuildFarmland.complete(action, tileImprovementRegistry?)` builds the `Farmland` through the `Built` rules of the
  action's rule registry, and removes nothing. If the tile has lost its `Irrigation` in the meantime (pillaged, say),
  it builds `Irrigation` instead, as the irrigation order would on that tile, when the ruleset's `Available` rules
  allow `Irrigation` there for the unit's player; otherwise it does nothing.
- `Rules/BuildingFarmland`: the `Busy` rule the unit is in while it works.
- `COMPLETE` (`base-unit-action-build-farmland:complete`): the handler a save records for work in progress, registered
  with `registerDelayedAction` when the module is loaded, as every delayed action is.

What `Farmland` does for a city's squares (more food with some city improvement, say) isn't here: that's the ruleset's.

## Who may build it, and where

The ruleset decides, with its own `Action` rule. base-unit-action-rules gives the usual criteria:

```ts
terrainJob(deps, Farmland, requiresImprovement(deps, Irrigation));
```

that is, a unit that `Terraforms`, with moves left, an `Available` rule allowing `Farmland` on the tile, the unit's own
tile, and `Irrigation` already on it. The `Available` rule is where the rest goes: an advance the player needs, no
city on the tile, no `Farmland` there already, a source of water. The turns it takes come from the ruleset's
`MovementCost` rules.

## One order, two actions

Some games give irrigating and building farmland one order: the irrigation order irrigates a tile that isn't irrigated,
and builds farmland on one that is. Here they stay two actions, `BuildIrrigation` and `BuildFarmland`, so each keeps
its own rule id, busy state and save handler. For a player they can still be one order:

- the ruleset makes their criteria exclude each other: `BuildIrrigation` only where there's no `Irrigation`, and
  `BuildFarmland` only where there is (`requiresImprovement`, above), so a unit is never offered both at once;
- a client puts `BuildFarmland` under the same key or menu entry as `BuildIrrigation`, after it, and sends whichever the
  unit is offered.

A library: it has no `main` and registers no rules.

## Following OpenCiv2

For a ruleset following OpenCiv2 (github.com/richardpenman/civ2, `src/auto/unit.cpp`), the irrigation order on an
irrigated square builds farmland. The order is refused on a city's square, without a source of water, on a square that
already has farmland, and without Refrigeration (`unit_cmd_terraform`). It takes the irrigation order's turns, and at
completion leaves the irrigation in place, or irrigates a square that has lost its irrigation meanwhile
(`unit_do_terrain_work`, order 6, in `unit_terrain_work_finish`). The menu entry is the irrigation one, relabelled
(`menu_update_settler_orders`).

One known difference: when the square's irrigation has gone, OpenCiv2 runs the irrigation order as it would on that
terrain, and on a terrain whose irrigation result is another terrain (`improve_to >= 0`), it changes the terrain. Here
the work only puts `Irrigation` back where the ruleset allows it, and otherwise does nothing.
