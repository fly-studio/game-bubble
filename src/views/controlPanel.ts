namespace ui {
	export class ControlPanel extends layer.ui.Sprite {

		private _shootAngle: number = 270;
		private gameSprite: egret.Sprite;
		private jetSprite: egret.Sprite;
		private raySprite: egret.Shape;
		private jetPoint: sharp.Point;

		private kb: KeyBoard;

		constructor(gameSprite: egret.Sprite, jetPoint?: sharp.Point)
		{
			super();
			this.gameSprite = gameSprite;
			this.jetPoint = jetPoint == null ? new sharp.Point(this.getStage().stageWidth / 2, this.getStage().stageHeight - 100) : jetPoint;
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

		public rotateLeft()
		{
			this.shootAngle -= 2;
			console.log('←');
		}

		public rotateRight()
		{
			this.shootAngle += 2;
			console.log('→');
		}

		public shoot()
		{
			console.log('↑');
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
			raySprite.x = 0;
			raySprite.y = 0;
			raySprite.width = this.stage.stageWidth;
			raySprite.height = this.stage.stageHeight;
			this.stage.addChild(raySprite);
			this.raySprite = raySprite;

			this.drawRay();
			this.kb = new KeyBoard();
			this.kb.addEventListener(KeyBoard.onkeydown, this.onKeyDown, this);

			//this.stage.touchEnabled = true;
			this.stage.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTap, this);

		}

		public reflectPoints(): sharp.Ray[]
		{
			let rect = sharp.Rectangle.create(this.gameSprite.x, this.gameSprite.y, this.gameSprite.width, this.gameSprite.height);
			let sides = rect.sides;
			let ray = new sharp.Ray(this.jetPoint, sharp.d2r(this.shootAngle));

			let i = 0;
			let rays: sharp.Ray[] = [];
			while (true) {
				let index = i % sides.length;
				if (i > sides.length * 6) //反射了6次
					break;
				let ray1 = ray.reflectLine(sides[index]);

				if (ray1 instanceof sharp.Ray) // 碰撞了
				{
					ray = ray1;
					if (index == 0) // 上
					{
						rays.push(ray);
						break;
					} else if (index == 1 || index == 3) {//左右
						rays.push(ray);
					}

				}
				i++;
			}

			return rays;
		}

		private drawRay()
		{
			if (!this.raySprite) return;

			this.raySprite.graphics.clear();
			this.raySprite.graphics.lineStyle(1, 0xcccccc);
			this.raySprite.graphics.drawRect(this.gameSprite.x, this.gameSprite.y, this.gameSprite.width, this.gameSprite.height);
			this.raySprite.graphics.lineStyle(1, 0xff00ff);

			let lastPoint = this.jetPoint;

			this.reflectPoints().forEach(ray => {
				this.raySprite.graphics.moveTo(lastPoint.x, lastPoint.y);
				this.raySprite.graphics.lineTo(ray.x, ray.y);
				this.raySprite.graphics.drawCircle(ray.x, ray.y, 1);
				this.raySprite.graphics.drawCircle(ray.x, ray.y, 10);
				this.raySprite.graphics.moveTo(ray.x, ray.y);
				lastPoint = ray.start;
			});
		}

		protected onKeyDown(event: any)
		{
			if (this.kb.isContain(event.data, KeyBoard.A) || this.kb.isContain(event.data, KeyBoard.keyArrow)) {
				this.rotateLeft();
			} else if (this.kb.isContain(event.data, KeyBoard.D) || this.kb.isContain(event.data, KeyBoard.RightArrow)) {
				this.rotateRight();
			} else if (this.kb.isContain(event.data, KeyBoard.SPACE) || this.kb.isContain(event.data, KeyBoard.W) || this.kb.isContain(event.data, KeyBoard.UpArrow)) {
				this.shoot();
			}
		}

		protected onTap(event: egret.TouchEvent)
		{
			let angle = sharp.slopeDegree(this.jetPoint, new sharp.Point(event.stageX, event.stageY));
			let theta = Math.abs(angle - this.shootAngle);
			egret.Tween.get(this).to({
				shootAngle: angle
			}, theta * 5).call(() => {
				this.shoot();
			});
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();

		}

		public removeAllEventListeners(): void {
			this.kb.removeEventListener(KeyBoard.onkeydown, this.onKeyDown, this);
			this.stage.removeEventListener(egret.TouchEvent.TOUCH_TAP, this.onTap, this);

		}
	}
}
