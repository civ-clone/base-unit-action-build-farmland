"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BuildFarmland_tileImprovementRegistry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildFarmland = exports.COMPLETE = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const Available_1 = require("@civ-clone/core-tile-improvement/Rules/Available");
const BuildingFarmland_1 = require("./Rules/BuildingFarmland");
const DelayedAction_1 = require("@civ-clone/core-unit/DelayedAction");
const Farmland_1 = require("@civ-clone/base-tile-improvement-farmland/Farmland");
const Irrigation_1 = require("@civ-clone/base-tile-improvement-irrigation/Irrigation");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const MovementCost_1 = require("@civ-clone/core-unit/Rules/MovementCost");
const registerDelayedAction_1 = require("@civ-clone/core-unit/registerDelayedAction");
exports.COMPLETE = 'base-unit-action-build-farmland:complete';
/**
 * Builds `Farmland` on the unit's own tile, which is meant to be irrigated already: the `Irrigation` stays, and the
 *  `Farmland` is built beside it. The work takes as many turns as the largest `MovementCost` answer for this action,
 *  divided by the unit's `WorkRate` (see `DelayedAction`).
 *
 * Which units may build it, and where, is the ruleset's: base-unit-action-rules' `terrainJob(deps, Farmland,
 *  requiresImprovement(deps, Irrigation))` gives the usual criteria (a unit that `Terraforms`, moves left, an
 *  `Available` rule allowing `Farmland` there, the unit's own tile, already irrigated).
 */
class BuildFarmland extends DelayedAction_1.default {
    /**
     * As `DelayedAction`'s, with the registry finishing looks for the tile's `Irrigation` in: the game's own, so a game
     *  built with its own registries finds it (civ-clone/web-renderer#248).
     */
    constructor(from, to, unit, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, pendingEffects = core_pending_effect_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance) {
        super(from, to, unit, ruleRegistry, turn, pendingEffects);
        _BuildFarmland_tileImprovementRegistry.set(this, void 0);
        __classPrivateFieldSet(this, _BuildFarmland_tileImprovementRegistry, tileImprovementRegistry, "f");
    }
    tileImprovementRegistry() {
        return __classPrivateFieldGet(this, _BuildFarmland_tileImprovementRegistry, "f");
    }
    perform() {
        const [moveCost] = this.ruleRegistry()
            .process(MovementCost_1.default, this.unit(), this)
            .sort((a, b) => b - a);
        super.perform(moveCost || 0, exports.COMPLETE, BuildingFarmland_1.default);
        this.ruleRegistry().process(Moved_1.default, this.unit(), this);
    }
    /**
     * What finishing does, on the tile the action was performed on, through the `Built` rules of the registry the action
     *  was constructed with: `Farmland` when the tile is still irrigated, keeping the `Irrigation`. When the irrigation has
     *  gone in the meantime (pillaged, say), the work irrigates the tile instead, as OpenCiv2's irrigation order does on
     *  a tile without irrigation (`unit_terrain_work_finish`, order 6), but only when the ruleset's `Available` rules
     *  allow `Irrigation` there for the unit's player; otherwise it does nothing.
     *
     * Static, as in the other delayed actions: a public instance member would make the class unassignable to `Action`.
     */
    static complete(action, tileImprovementRegistry = TileImprovementRegistry_1.instance) {
        const tile = action.from(), irrigated = tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Irrigation_1.default);
        if (!irrigated) {
            if (action
                .ruleRegistry()
                .get(Available_1.default)
                .some((rule) => rule.validate(tile, Irrigation_1.default, action.unit().player()))) {
                new Irrigation_1.default(tile, action.ruleRegistry());
            }
            return;
        }
        new Farmland_1.default(tile, action.ruleRegistry());
    }
}
exports.BuildFarmland = BuildFarmland;
_BuildFarmland_tileImprovementRegistry = new WeakMap();
// Registered here, as every delayed action is, so a unit part-way through this can be saved: the save records the
//  identifier and the behaviour stays in this package.
(0, registerDelayedAction_1.default)({
    BusyRule: BuildingFarmland_1.default,
    handler: exports.COMPLETE,
    // Built from the game the unit is loaded into, so finishing after a load writes where that game looks
    //  (civ-clone/web-renderer#248).
    action: (unit, context) => new BuildFarmland(unit.tile(), unit.tile(), unit, context.rules, context.turn, context.pendingEffects, context.tileImprovements),
    complete: (unit, pendingEffect, action) => BuildFarmland.complete(action, action.tileImprovementRegistry()),
});
exports.default = BuildFarmland;
//# sourceMappingURL=BuildFarmland.js.map