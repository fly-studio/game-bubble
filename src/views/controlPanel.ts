namespace ui {
	export class ControlPanel extends layer.ui.Sprite {

		private _shootAngle: number = 279;
		private gameSprite: egret.Sprite;
		private jetSprite: egret.Sprite;
		private raySprite: egret.Shape;
		private jetPoint: egret.Point;

		constructor(gameSprite: egret.Sprite, jetPoint?: egret.Point)
		{
			super();
			this.gameSprite = gameSprite;
			this.jetPoint = jetPoint == null ? new egret.Point(this.getStage().stageWidth / 2, this.getStage().stageHeight - 100) : jetPoint;
		}

		public set shootAngle(v: number){
			if (v < 190)
				v = 190;
			else if (v > 350)
				v = 350;
			
			this._shootAngle = v;

			this.drawRay();
			
			if (this.jetSprite)
				this.jetSprite.rotation = v - 270
		}

		
		public get shootAngle() : number {
			return this._shootAngle;
		}

		public onAddedToStage(event: egret.Event) : void {
			let frameSprite = new egret.Sprite();
			frameSprite.x = 0;
			frameSprite.y = this.stage.stageHeight - 100;
			frameSprite.graphics.lineStyle(1, 0xcccccc);
			frameSprite.graphics.drawRect(0, 0, this.stage.stageWidth, 100);
			this.addChild(frameSprite);

			let jetSprite = new egret.Sprite();
			jetSprite.x = this.jetPoint.x;
			jetSprite.y = this.jetPoint.y;
			jetSprite.rotation = this.shootAngle - 270;

			jetSprite.graphics.lineStyle(1, 0xff0000);
			jetSprite.graphics.drawCircle(0, 0, 15);
			jetSprite.graphics.drawCircle(0, 0, 5);
			jetSprite.graphics.moveTo(0, -15);
			jetSprite.graphics.lineTo(0, -35);
			let {x, y} = sharp.circlePoint(new sharp.Point(0, -35), 15, sharp.d2r(45));
			jetSprite.graphics.lineTo(x, y),
			jetSprite.graphics.moveTo(0, -35);
			({x, y} = sharp.circlePoint(new sharp.Point(0, -35), 15, sharp.d2r(135)));
			jetSprite.graphics.lineTo(x, y),
			this.addChild(jetSprite);
			this.jetSprite = jetSprite;

			let raySprite = new egret.Shape();
			raySprite.width = this.stage.stageWidth;
			raySprite.height = this.stage.stageHeight;
			this.addChild(raySprite);
			this.raySprite = raySprite;

			this.drawRay();
		}

		private drawRay()
		{
			if (!this.raySprite) return;

			let rect = this.gameSprite.getBounds();
			

			this.raySprite.graphics.clear();
			this.graphics.lineStyle(1, 0xff00ff, .8);
			this.graphics.moveTo(this.jetPoint.x, this.jetPoint.y);


			//this.graphics.lineTo(pt.x, pt.y);
			
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}
	}
}