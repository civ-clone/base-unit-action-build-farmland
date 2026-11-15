import BuildFarmland, { COMPLETE } from '../BuildFarmland';
import Available from '@civ-clone/core-tile-improvement/Rules/Available';
import BuildingFarmland from '../Rules/BuildingFarmland';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Farmland from '@civ-clone/base-tile-improvement-farmland/Farmland';
import Generator from '@civ-clone/core-world-generator/Generator';
import Irrigation from '@civ-clone/base-tile-improvement-irrigation/Irrigation';
import MovementCost from '@civ-clone/core-unit/Rules/MovementCost';
import PendingEffectRegistry from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import WorkRate from '@civ-clone/core-unit/Rules/WorkRate';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';

class Engineers extends Unit {}

describe('BuildFarmland', (): void => {
  const setUp = (cost: number) => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffects = new PendingEffectRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      turn = new Turn(),
      tile = new Tile(0, 0, new Terrain(), new World(new Generator(1, 1))),
      built: [Tile, TileImprovement][] = [];

    turn.set(5);

    ruleRegistry.register(
      new MovementCost(
        new Criterion(
          (unit: Unit, action: unknown) => action instanceof BuildFarmland
        ),
        new Effect((): number => cost)
      ),
      new Built(
        new Effect((builtTile: Tile, improvement: TileImprovement): void => {
          built.push([builtTile, improvement]);

          tileImprovementRegistry.register(improvement);
        })
      )
    );

    const unit = new Engineers(null, new Player(), tile, ruleRegistry),
      action = new BuildFarmland(
        tile,
        tile,
        unit,
        ruleRegistry,
        turn,
        pendingEffects
      );

    return {
      action,
      built,
      pendingEffects,
      ruleRegistry,
      tile,
      tileImprovementRegistry,
      unit,
    };
  };

  // Civ2 builds Farmland with the irrigation order on an irrigated square, so it takes that order's turns (survey-terrain,
  //  the Orders table; OpenCiv2 `unit_terrain_work_turns`, order 6): `irrigate_turns`, 5 on Grassland, say.
  it('starts work that finishes after the `MovementCost` answer in turns, with the unit busy and out of moves', (): void => {
    const { action, pendingEffects, unit } = setUp(5);

    action.perform();

    const [pendingEffect] = pendingEffects.getByTarget(unit);

    expect(pendingEffect.handler()).to.equal(COMPLETE);
    expect(pendingEffect.data()).to.deep.equal({ endTurn: '10' });
    expect(unit.busy()).to.instanceof(BuildingFarmland);
    expect(unit.moves().value()).to.equal(0);
  });

  // Engineers work at twice the rate (survey-terrain's work rate, OpenCiv2 `unit_do_terrain_work`): 5 turns' work takes 3.
  it("takes the turns divided by the unit's `WorkRate`, rounded up", (): void => {
    const { action, pendingEffects, ruleRegistry, unit } = setUp(5);

    ruleRegistry.register(new WorkRate(new Effect((): number => 2)));

    action.perform();

    const [pendingEffect] = pendingEffects.getByTarget(unit);

    expect(pendingEffect.data()).to.deep.equal({ endTurn: '8' });
  });

  // Civ2's farmland is the irrigation bit and the mine bit together (0x0c, OpenCiv2 `unit_terrain_work_finish`: an irrigated
  //  square gets `tile_set_improvements(x, y, 0xc, 1, 1)`), so the irrigation is still there: here, both improvements.
  it('builds `Farmland` on its tile when it completes, through the `Built` rules, keeping the irrigation', (): void => {
    const { action, built, ruleRegistry, tile, tileImprovementRegistry } =
      setUp(5);

    new Irrigation(tile, ruleRegistry);

    BuildFarmland.complete(action, tileImprovementRegistry);

    expect(built).to.have.length(2);
    expect(built[1][0]).to.equal(tile);
    expect(built[1][1]).to.instanceof(Farmland);
    expect(
      tileImprovementRegistry
        .getByTile(tile)
        .map((improvement) => improvement.constructor)
    ).to.deep.equal([Irrigation, Farmland]);
  });

  // OpenCiv2 `unit_terrain_work_finish`, order 6: a tile without irrigation when the work finishes is irrigated, here
  //  when the ruleset's `Available` rules still allow it.
  [true, false].forEach((allowed: boolean): void =>
    it(`${
      allowed ? 'irrigates the tile instead' : 'does nothing'
    } when its irrigation has gone by the time it completes and Irrigation is ${
      allowed ? '' : 'not '
    }available there`, (): void => {
      const { action, built, ruleRegistry, tile, tileImprovementRegistry } =
        setUp(5);

      const irrigation = new Irrigation(tile, ruleRegistry);

      tileImprovementRegistry.unregister(irrigation);

      ruleRegistry.register(
        new Available(
          new Criterion(
            (availableTile: Tile, Improvement: unknown): boolean =>
              availableTile === tile && Improvement === Irrigation && allowed
          )
        )
      );

      BuildFarmland.complete(action, tileImprovementRegistry);

      expect(
        tileImprovementRegistry
          .getByTile(tile)
          .map((improvement) => improvement.constructor)
      ).to.deep.equal(allowed ? [Irrigation] : []);
      expect(built.length).to.equal(allowed ? 2 : 1);
    })
  );
});
