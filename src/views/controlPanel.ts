namespace ui {
	export class ControlPanel extends layer.ui.Sprite {

		private _shootAngle: number = 270;
		public meshSprite: MeshUI;
		private jetSprite: egret.Sprite;
		private raySprite: egret.Shape;
		public jetPoint: sharp.Point;

		constructor(jetPoint: sharp.Point)
		{
			super();
			this.jetPoint = jetPoint
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
			this.shootAngle -= 1;
			console.log('←');
		}

		public rotateRight()
		{
			this.shootAngle += 1;
			console.log('→');
		}

		public shoot(prepareBubble: BubbleUI, traces: sharp.Point[]): Promise<any>
		{
			console.log('↑');
			let duration = (p1: sharp.Point, p2: sharp.Point) => {
				return sharp.distance(p1, p2) / 2; // 1px per 1ms
			}
			let ts = [...traces];
			return new Promise(reslove => {
				let lastPoint = ts.shift();
				let tween = egret.Tween.get(prepareBubble)
					.to({
						x: lastPoint.x,
						y: lastPoint.y
					}, 100);
				for(let trace of ts)
				{
					tween = tween.to({
						x: trace.x,
						y: trace.y
					}, duration(trace, lastPoint));
					lastPoint = trace;
				}
				tween.call(() => {
					reslove();
				});
			});
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
		}

		private drawRay()
		{
			if (!this.raySprite || !this.meshSprite) return;

			let p = this.meshSprite.localToGlobal(0, 0);
			this.raySprite.graphics.clear();
			this.raySprite.graphics.lineStyle(1, 0xcccccc);
			this.raySprite.graphics.drawRect(p.x, p.y, this.meshSprite.width, this.meshSprite.height);
			this.raySprite.graphics.lineStyle(1, 0xff00ff);

			let lastPoint = this.jetPoint;

			this.meshSprite.reflectRays(this.jetPoint, this.shootAngle).forEach(ray => {
				this.raySprite.graphics.moveTo(lastPoint.x, lastPoint.y);
				this.raySprite.graphics.lineTo(ray.x, ray.y);
				this.raySprite.graphics.drawCircle(ray.x, ray.y, 1);
				this.raySprite.graphics.drawCircle(ray.x, ray.y, 10);
				this.raySprite.graphics.moveTo(ray.x, ray.y);
				lastPoint = ray.start;
			});

			this.raySprite.graphics.lineStyle(1, 0xff);
			this.raySprite.graphics.beginFill(1, 0xff);
			lastPoint = this.jetPoint;
			let rays = this.meshSprite.reflectRays(this.jetPoint, this.shootAngle),
				intersection = this.meshSprite.intersectsBubble(rays),
				traces = this.meshSprite.circleTraces(rays, intersection);
			traces.forEach(p => {
				this.raySprite.graphics.moveTo(lastPoint.x, lastPoint.y);
				this.raySprite.graphics.lineTo(p.x, p.y);
				this.raySprite.graphics.drawCircle(p.x, p.y, 2);
				lastPoint = p;
			});
			this.raySprite.graphics.endFill();
			this.raySprite.graphics.drawCircle(lastPoint.x, lastPoint.y, this.meshSprite.radius);
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();

		}

		public removeAllEventListeners(): void {


		}
	}
}
