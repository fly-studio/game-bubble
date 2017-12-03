namespace ui {
	export class GameUI extends layer.ui.Sprite {
		public mesh: Mesh;
		protected meshSprite: MeshUI;
		protected controlSprite: ControlPanel;
  		private prepareSprite: ui.PrepareSprite;
		private kb:KeyBoard;
		protected jetPoint: sharp.Point;


		constructor()
		{
			super();
			this.mesh = new Mesh(8, 8);
			this.mesh.cellColors = [
				0xff0000,
				0x00ff00,
				0x0000ff,
				0xff00ff,
				0x00ffff,
				0x0,
				0xffff00

			];
			this.jetPoint = new sharp.Point(this.getStage().stageWidth / 2, this.getStage().stageHeight - 100);
		}

		public onAddedToStage(event: egret.Event) : void {

			let prepareSprite = new ui.PrepareSprite(this.jetPoint);
			prepareSprite.x = 0;
			prepareSprite.y = 0;
			this.addChild(prepareSprite);
			this.prepareSprite = prepareSprite;

			this.controlSprite = new ui.ControlPanel(this.jetPoint);
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
			this.mesh.createMesh(_.range(32));

			this.buildMeshSprite();
		}

		public shoot()
		{
			let rays = this.meshSprite.reflectRays(this.jetPoint, this.controlSprite.shootAngle),
				intersection = this.meshSprite.intersectsBubble(rays),
				traces = this.meshSprite.circleTraces(rays, intersection);
			let prepareBubble = this.prepareSprite.prepareBubble;

			if (intersection.rayIndex == -1)
				return ;

			intersection.cell.colorIndex = prepareBubble.cell.colorIndex;
			prepareBubble.cell = intersection.cell;
			Promise.all([
				this.controlSprite.shoot(prepareBubble, traces),
				this.prepareSprite.pushBubble(this.meshSprite.createPrepareBubble()),
			]).then(v => {
				this.meshSprite.replaceBubbleUI(prepareBubble);
			});
		}

		public buildMeshSprite()
		{
			if (this.meshSprite)
			{
				this.meshSprite.destroy();
				this.controlSprite.destroy();
			}

			this.meshSprite = new MeshUI(this.mesh);
			this.meshSprite.x = this.stage.stageWidth * .025;
			this.meshSprite.y = 0;
			this.meshSprite.width = this.stage.stageWidth * .95;
			this.meshSprite.height = this.stage.stageHeight;
			this.addChild(this.meshSprite);

			this.controlSprite.meshSprite = this.meshSprite;

			this.prepareSprite.pushBubble(this.meshSprite.createPrepareBubble());
		}

		protected onKeyDown(event: any)
		{
			if (this.kb.isContain(event.data, KeyBoard.A) || this.kb.isContain(event.data, KeyBoard.keyArrow)) {
				this.controlSprite.rotateLeft();
			} else if (this.kb.isContain(event.data, KeyBoard.D) || this.kb.isContain(event.data, KeyBoard.RightArrow)) {
				this.controlSprite.rotateRight();
			} else if (this.kb.isContain(event.data, KeyBoard.SPACE) || this.kb.isContain(event.data, KeyBoard.W) || this.kb.isContain(event.data, KeyBoard.UpArrow)) {
				this.shoot();
			}
		}

		protected onTap(event: egret.TouchEvent)
		{
			let angle = sharp.slopeDegree(this.jetPoint, new sharp.Point(event.stageX, event.stageY));
			let theta = Math.abs(angle - this.controlSprite.shootAngle);
			egret.Tween.get(this.controlSprite).to({
				shootAngle: angle
			}, theta * 5).call(() => {
				this.shoot();
			});
		}

	}
}
