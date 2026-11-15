import BuildingFarmland from './Rules/BuildingFarmland';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Farmland from '@civ-clone/base-tile-improvement-farmland/Farmland';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import Unit from '@civ-clone/core-unit/Unit';
import registerDelayedAction from '@civ-clone/core-unit/registerDelayedAction';

export const COMPLETE = 'base-unit-action-build-farmland:complete';

/**
 * Builds `Farmland` on the unit's own tile, which is meant to be irrigated already: the `Irrigation` stays, and the
 *  `Farmland` is built beside it. The work takes as many turns as the largest `MovementCost` answer for this action,
 *  divided by the unit's `WorkRate` (see `DelayedAction`).
 *
 * Which units may build it, and where, is the ruleset's: base-unit-action-rules' `terrainJob(deps, Farmland,
 *  requiresImprovement(deps, Irrigation))` gives the usual criteria (a unit that `Terraforms`, moves left, an
 *  `Available` rule allowing `Farmland` there, the unit's own tile, already irrigated).
 */
export class BuildFarmland extends DelayedAction {
  perform(): void {
    const [moveCost]: number[] = this.ruleRegistry()
      .process(MovementCost, this.unit(), this)
      .sort((a: number, b: number): number => b - a);

    super.perform(moveCost || 0, COMPLETE, BuildingFarmland);

    this.ruleRegistry().process(Moved, this.unit(), this);
  }

  /**
   * What finishing does: `Farmland` on the tile the action was performed on, built through the `Built` rules of the
   *  registry the action was constructed with. Nothing on the tile is removed.
   *
   * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
   */
  static complete(action: BuildFarmland): void {
    new Farmland(action.from(), action.ruleRegistry());
  }
}

// Registered here, as every delayed action is, so a unit part-way through this can be saved: the save records the
//  identifier and the behaviour stays in this package.
registerDelayedAction({
  BusyRule: BuildingFarmland,
  handler: COMPLETE,
  action: (unit: Unit) => new BuildFarmland(unit.tile(), unit.tile(), unit),
  complete: (unit, pendingEffect, action) => BuildFarmland.complete(action),
});

export default BuildFarmland;
