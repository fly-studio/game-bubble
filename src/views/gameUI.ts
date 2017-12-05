namespace ui {
	export class GameUI extends layer.ui.Sprite {
		public mesh: Mesh;
		protected meshSprite: MeshUI;
		protected controlSprite: ControlPanel;
  		protected prepareSprite: ui.PrepareSprite;
		private kb: KeyBoard;
		private container: MeshContainer;
		private enabled: boolean;

		constructor()
		{
			super();
			this.mesh = new Mesh(14, 8);
			this.mesh.cellColors = [
				0xff0000,
				0x00ff00,
				0x0000ff,
				0xff00ff,
				0x00ffff,
				0x0,
				0xffff00
			];
			this.enabled = true;
			let stage = this.getStage();
			this.container = new MeshContainer(this.mesh, new sharp.Rectangle(stage.stageWidth * .025, 0, stage.stageWidth * .95, stage.stageHeight), new sharp.Point(stage.stageWidth / 2, stage.stageHeight - 100));
		}

		public onAddedToStage(event: egret.Event) : void {

			let prepareSprite = new ui.PrepareSprite(this.container);
			prepareSprite.x = 0;
			prepareSprite.y = 0;
			this.addChild(prepareSprite);
			this.prepareSprite = prepareSprite;

			this.controlSprite = new ui.ControlPanel(this.container);
			this.addChild(this.controlSprite);

			this.kb = new KeyBoard();
			this.kb.addEventListener(KeyBoard.onkeydown, this.onKeyDown, this);

			this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTap, this);
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {
			this.kb.removeEventListener(KeyBoard.onkeydown, this.onKeyDown, this);
			this.stage.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onTap, this);
		}

		public start()
		{
			this.enabled = true;
			this.mesh.createMesh(_.range(16));

			this.buildMeshSprite();
		}

		public stop()
		{
			this.enabled = false;

			layer.ui.alert('Game Over');
		}

		public async shoot()
		{
			this.enabled = false;
			let rays = this.container.reflectRays(),
				intersection = this.container.intersectsBubble(rays),
				traces = this.container.circleTraces(rays, intersection);

			if (intersection.rayIndex < 0)
				return ;

			let prepareBubble = this.prepareSprite.prepareBubble;
			prepareBubble.cell.index = intersection.cell.index;

			await Promise.all([ // 同时
				this.controlSprite.renderShooting(prepareBubble, traces),
				this.prepareSprite.pushBubble(this.container.createPrepareBubble())
			]);

			if (intersection.cell && intersection.cell.row >= this.mesh.rows - 1) // 最后一行被填值
				return this.stop();

			this.meshSprite.replaceBubbleUI(prepareBubble);

			let crushes: CrushedCells = this.mesh.crushedCells(),
				crushedGroup: CrushedGroup = crushes.cellInGroup(intersection.cell.index);
			if (crushedGroup.cellIndices.length > 0) // 有消除的 
			{
				let dropingIndices: number[] = this.mesh.dropingIndices(crushedGroup.cellIndices);
				await Promise.all([
					this.meshSprite.renderCrush(crushedGroup),
					this.meshSprite.renderDroping(dropingIndices),
				]);
			}

			this.enabled = true;
		}


		public buildMeshSprite()
		{
			if (this.meshSprite)
				this.meshSprite.destroy();

			this.meshSprite = new MeshUI(this.container);
			this.addChild(this.meshSprite);

			this.prepareSprite.pushBubble(this.container.createPrepareBubble());
		}

		protected onKeyDown(event: any)
		{
			if (this.kb.isContain(event.data, KeyBoard.A) || this.kb.isContain(event.data, KeyBoard.keyArrow)) {
				this.controlSprite.rotateLeft();
			} else if (this.kb.isContain(event.data, KeyBoard.D) || this.kb.isContain(event.data, KeyBoard.RightArrow)) {
				this.controlSprite.rotateRight();
			} else if (this.kb.isContain(event.data, KeyBoard.SPACE) || this.kb.isContain(event.data, KeyBoard.W) || this.kb.isContain(event.data, KeyBoard.UpArrow)) {
				if (!this.enabled) return;
				this.shoot();
			}
		}

		protected onTap(event: egret.TouchEvent)
		{
			if (!this.enabled) return;
			let angle = sharp.slopeDegree(this.container.jetPoint, new sharp.Point(event.stageX, event.stageY));
			let theta = Math.abs(angle - this.controlSprite.shootAngle);
			egret.Tween.get(this.controlSprite).to({
				shootAngle: angle
			}, theta * 5).call(() => {
				this.shoot();
			});
		}

	}
}
