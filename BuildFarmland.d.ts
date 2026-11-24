import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import DelayedAction from '@civ-clone/core-unit/DelayedAction';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const COMPLETE = 'base-unit-action-build-farmland:complete';
/**
 * Builds `Farmland` on the unit's own tile, which is meant to be irrigated already: the `Irrigation` stays, and the
 *  `Farmland` is built beside it. The work takes as many turns as the largest `MovementCost` answer for this action,
 *  divided by the unit's `WorkRate` (see `DelayedAction`).
 *
 * Which units may build it, and where, is the ruleset's: base-unit-action-rules' `terrainJob(deps, Farmland,
 *  requiresImprovement(deps, Irrigation))` gives the usual criteria (a unit that `Terraforms`, moves left, an
 *  `Available` rule allowing `Farmland` there, the unit's own tile, already irrigated).
 */
export declare class BuildFarmland extends DelayedAction {
  #private;
  /**
   * As `DelayedAction`'s, with the registry finishing looks for the tile's `Irrigation` in: the game's own, so a game
   *  built with its own registries finds it (civ-clone/web-renderer#248).
   */
  constructor(
    from: Tile,
    to: Tile,
    unit: Unit,
    ruleRegistry?: RuleRegistry,
    turn?: Turn,
    pendingEffects?: PendingEffectRegistry,
    tileImprovementRegistry?: TileImprovementRegistry
  );
  tileImprovementRegistry(): TileImprovementRegistry;
  perform(): void;
  /**
   * What finishing does, on the tile the action was performed on, through the `Built` rules of the registry the action
   *  was constructed with: `Farmland` when the tile is still irrigated, keeping the `Irrigation`. When the irrigation has
   *  gone in the meantime (pillaged, say), the work irrigates the tile instead, as OpenCiv2's irrigation order does on
   *  a tile without irrigation (`unit_terrain_work_finish`, order 6), but only when the ruleset's `Available` rules
   *  allow `Irrigation` there for the unit's player; otherwise it does nothing.
   *
   * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
   */
  static complete(
    action: BuildFarmland,
    tileImprovementRegistry?: TileImprovementRegistry
  ): void;
}
export default BuildFarmland;
