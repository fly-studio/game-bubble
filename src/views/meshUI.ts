namespace ui {
	export interface IntersectsBubble {
		rayIndex: number;
		cell: Cell|null;
	};

	export class MeshUI extends layer.ui.Sprite {
		public colorList: number[];

		private mesh: Mesh;
		public radius: number;
		public diameter: number;
		private crossDeltaHeight: number;

		constructor(mesh: Mesh)
		{
			super();

			this.mesh = mesh;
		}

		public onAddedToStage(event: egret.Event): void
		{
			if (this.width <= 0 || this.height <= 0)
				throw new Error('set width,height, first');

			this.diameter = this.width / this.mesh.cols;
			this.radius = this.diameter / 2;
			this.crossDeltaHeight = this.diameter -  this.diameter * Math.cos(sharp.d2r(30));
			this.renderMesh();
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}

		public getCellPoint(rowOrIndex: number, col: number): sharp.Point
		{
			let row: number = rowOrIndex;
			if (col == null)
			{
				row = this.mesh.row(rowOrIndex);
				col = this.mesh.col(rowOrIndex);
			}

			let x: number = col * this.diameter;
			let y: number = row * this.diameter - this.crossDeltaHeight * row; //减去圆顶部相交的地方

			if (row % 2 == 1) // 偶数行
				x += this.radius
			return new sharp.Point(x, y);
		}

		public getCellRectangle(rowOrIndex: number, col?: number) : sharp.Rectangle
		{
			let position: sharp.Point = this.getCellPoint(rowOrIndex, col);
			return new sharp.Rectangle(
				position.x,
				position.y,
				this.diameter,
				this.diameter
			);
		}

		public createBubbleUI(cell: Cell, rect: sharp.Rectangle)
		{
			let ui: BubbleUI = new BubbleUI(cell);
			ui.x = rect.x;
			ui.y = rect.y;
			ui.width = rect.width;
			ui.height = rect.height;
			ui.name = "cell";
			return ui;
		}

		public replaceBubbleUI(bubbleUI: BubbleUI)
		{
			let rect = this.getCellRectangle(bubbleUI.cell.index);
			bubbleUI.x = rect.x;
			bubbleUI.y = rect.y;
			bubbleUI.width = rect.width;
			bubbleUI.height = rect.height;
			bubbleUI.anchorOffsetX = 0;
			bubbleUI.anchorOffsetY = 0;
			this.addChild(bubbleUI);

			this.mesh.cells[bubbleUI.cell.index] = bubbleUI.cell;
		}

		public renderMesh() : void
		{
			this.removeChildren();

			for(let index of this.mesh.indicesEntries()) {
				let cellUI: BubbleUI = this.createBubbleUI(this.mesh.cell(index), this.getCellRectangle(index));
				this.addChild(cellUI);
			}
		}

		/**
		 * ray为舞台坐标
		 */
		public reflectRays(jetPoint: sharp.Point, shootAngle: number): sharp.Ray[]
		{
			let p = this.localToGlobal(this.radius, this.radius),
				rect = sharp.Rectangle.create(p.x, p.y, this.width - this.diameter, this.height - this.radius), //由于是圆，所以碰撞的矩形是以左右上下的圆心为基准
				sides = rect.sides,
				ray = new sharp.Ray(jetPoint, sharp.d2r(shootAngle)),
				i: number = 0,
				index: number,
				rays: sharp.Ray[] = [ray],
				ray1: any;
			while (true) {
				index = i % sides.length;
				if (i > sides.length * 6) //反射了12次
					break;
				ray1 = ray.reflectLine(sides[index]);

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

		/**
		 *
		 */
		public intersectsBubble(rays: sharp.Ray[]): IntersectsBubble
		{
			// 第一个是喷嘴
			if (rays.length <= 1)
				return {
					rayIndex: -1,
					cell: null
				}
			let lastPoint = rays[0].start,
				rayIndex: number,
				cell: Cell,
				siblingCell: Cell,
				rect: sharp.Rectangle,
				ray: sharp.Ray,
				row: number,
				col: number,
				index: number,
				p: sharp.Point,
				i: number;

			for(rayIndex = 1; rayIndex < rays.length; ++rayIndex) {
				ray = rays[rayIndex];
				for(index of this.mesh.indicesEntries(-1)) // revert
				{
					rect = this.getCellRectangle(index);
					p = sharp.Point.createFrom(this.localToGlobal(rect.centerPoint.x, rect.centerPoint.y)); // 转换为stage坐标
					if (sharp.lineHitCircle(lastPoint, ray.start, p, this.radius + .5)) // 与哪个圆相交, +1 是为了避免270°时恰好在切线上
					{
						cell = this.mesh.cell(index);
						if (cell.evenLast) // 偶数行的最后一个
							cell = this.mesh.cell(index - 1);

						if (!cell.blank) // 和一个实心相交
							continue;
						row = this.mesh.row(index);
						col = this.mesh.col(index);

						if (row == 0) // 顶部
							return {
								rayIndex,
								cell
							};
						let rang = [[row, col -1], [row, col + 1], [row - 1, col], [row + 1, col] ]; // 左 右 上
						if (cell.evenRow) rang.push([row - 1, col + 1], [row + 1, col + 1]); else rang.push([row - 1, col - 1], [row + 1, col - 1]); // 见 mesh#crushedCells
						for (i = 0; i < rang.length; i++) {
							let r = rang[i];
							if (r[1] < 0 || r[1] >= this.mesh.cols || r[0] >= this.mesh.rows)
								continue;

							siblingCell = this.mesh.cell(r[0], r[1]);
							if (!siblingCell.blank)
								return {
									rayIndex,
									cell
								};
						}
					}
				}
				lastPoint = ray.start;
			}
			// 说明满了，可以直接挂了
			return {rayIndex: -1, cell: null}
		}

		/**
		 * 圆心轨迹，均为舞台坐标
		 */
		public circleTraces(rays: sharp.Ray[], intersection: IntersectsBubble): sharp.Point[]
		{
			let	points: sharp.Point[] = [rays[0].start];
			if (!intersection.cell) // game over
				return points;
			for(let i = 1; i < intersection.rayIndex; ++i)
				points.push(rays[i].start);
			let lastLine = new sharp.Line(points[points.length - 1], rays[intersection.rayIndex].start);

			let rect = this.getCellRectangle(intersection.cell.index),
				p = sharp.Point.createFrom(this.localToGlobal(rect.centerPoint.x, rect.centerPoint.y)); // 转换为stage坐标

			/*if (!lastLine.pointOnLine(p.x, p.y)) // 圆心的点不在射线上，则需要回弹
			{
				// 计算与射线的交点
				let p1 = lastLine.intersects(sharp.Line.create(p.x, p.y, 0, p.y), false);
				if (p1 instanceof sharp.Point)
					points.push(p1);
			}*/
			points.push(p);
			return points;
		}

		/**
		 * 在当前可以消除的cell中，随机一个颜色
		 * 算法是从底部开始取颜色，让用户可以率先消除底部球
		 * 样本颜色设置少一点，方便消除，默认只有总数的2/3
		 */
		protected randomColor(referenceCount?: number): number
		{
			if (referenceCount == undefined)
				referenceCount = this.mesh.cellColors.length * .6;
			let colorIndices: number[] = [];
			for(let index of this.mesh.indicesEntries(-1))
			{
				let cell = this.mesh.cell(index);
				if (colorIndices.length >= referenceCount) break;
				if (cell.colorIndex > -1 && !colorIndices.includes(cell.colorIndex))
					colorIndices.push(cell.colorIndex);
			}

			return colorIndices[_.random(0, colorIndices.length - 1)];
		}

		public createPrepareBubble()
		{
			let cell = new Cell(this.mesh, -1);
			cell.colorIndex = this.randomColor();
			let ui: BubbleUI = new BubbleUI(cell);
			ui.anchorOffsetX = this.radius;
			ui.anchorOffsetY = this.radius;
			ui.width = this.diameter;
			ui.height = this.diameter;
			ui.name = "cell";
			return ui;
		}

	}
}
