interface IntersectsBubble {
	rayIndex: number;
	cell: Cell|null;
};

class MeshContainer {
	public mesh: Mesh;
	public rect: sharp.Rectangle;
	public shootAngle: number = 270;
	public radius: number;
	public diameter: number;
	public jetPoint: sharp.Point;
	private crossDeltaHeight: number;

	constructor(mesh: Mesh, rect: sharp.Rectangle, jetPoint: sharp.Point)
	{
		this.mesh = mesh;
		this.rect = rect;
		this.diameter = rect.width / this.mesh.cols;
		this.radius = this.diameter / 2;
		this.jetPoint = jetPoint;
		this.crossDeltaHeight = this.diameter -  this.diameter * Math.cos(sharp.d2r(30)); //3相同的圆相切，60度，换算成直角就是30度
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

	/**
	 * 计算喷嘴每次移动多少
	 * 公式详见sharp.ts
	 */
	public getPerAngle()
	{
		let C = this.getCirclePos(this.mesh.index(1, 0)),
			B = this.getCirclePos(this.mesh.index(1, this.mesh.cols - 2)),
			b = C.distance(this.jetPoint),
			c = B.distance(this.jetPoint),
			a = B.distance(C);
		return Math.acos((b * b + c * c - a * a) / (2 * b * c)) / (this.mesh.cols - 2 ) / 2;
	}

	public localToGlobal(x: number, y: number)
	{
		return sharp.Point.create(x, y).add(this.rect.x, this.rect.y);
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

	public getCirclePos(cellIndex: number): sharp.Point
	{
		let rect = this.getCellRectangle(cellIndex);
		return this.localToGlobal(rect.centerPoint.x, rect.centerPoint.y); //圆心 转换为stage坐标
	}

	/**
	 * ray为绝对坐标
	 */
	public reflectRays(): sharp.Ray[]
	{
		let p = this.localToGlobal(this.radius, this.radius),
			rect = sharp.Rectangle.create(p.x, p.y, this.rect.width - this.diameter, this.rect.height - this.radius), //由于是圆，所以碰撞的矩形是以左右上下的圆心为基准
			sides = rect.sides,
			ray = new sharp.Ray(this.jetPoint, sharp.d2r(Math.abs(this.shootAngle - 270) <= 0.00001 ? 270.00001 : this.shootAngle)),
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
		let ray: sharp.Ray,
			rayIndex: number,
			cell: Cell,
			index: number,
			circlePoint: sharp.Point,
			circlePoints: any[],
			circle: sharp.Circle,
			tangencyPoints: sharp.Point[],
			slope: number,
			result: IntersectsBubble = {
				rayIndex: -1, cell: null
			};

		for(rayIndex = 0; rayIndex < rays.length - 1; ++rayIndex) { //顶点肯定在顶部
			circlePoints = [];
			ray = rays[rayIndex];
			
			for(index of this.mesh.indicesEntries(-1)) // revert
			{
				cell = this.mesh.cell(index);
				if (cell.blank)
					continue;
				
				circlePoint = this.getCirclePos(cell.index);
				// 计算与第一个圆相切的切点，放大1倍
				circle = new sharp.Circle(circlePoint, this.diameter);
				tangencyPoints = ray.intersectsCircle(circle);

				if (tangencyPoints.length <= 0) // 不相交
					continue;
				
				tangencyPoints.sort((a, b) => a.distance(ray.start) - b.distance(ray.start)); //按距离排序
				// 第一个便是切点

				circlePoints.push([tangencyPoints[0], cell]);

				if (ray.intersectsCircle(new sharp.Circle(circlePoint, this.radius)).length > 0) // 有线穿过本圆
					break;
			}

			if ( circlePoints.length > 0) // 有相交
			{
				circlePoints.sort((a, b) => a[0].distance(ray.start) - b[0].distance(ray.start)); //按距离排序
				let range = [];
				for (let [p, cell] of circlePoints)
				{
					circlePoint = this.getCirclePos(cell.index);
					slope = sharp.r2d(circlePoint.angle(p));
					slope = ((slope + 360) % 360);
					console.log(cell.index, slope);
					if (slope <= 45 || slope >= 337.5) // 右相切 45°
					{
						range.push([cell.row, cell.col + 1]);
					}
					else if (slope >= 135 && slope <= 202.5) // 左相切 45°
					{
						range.push([cell.row, cell.col - 1]);
					}
					else if (slope < 337.5 && slope > 270)  // 右上 67.5°
					{
						if (cell.evenRow) // 偶数行 \
							range.push([cell.row - 1, cell.col + 1]);
						else
							range.push([cell.row - 1, cell.col])
					}
					else if (slope > 202.5 && slope <= 270) // 左上 67.5°
					{
						if (cell.evenRow) // 偶数行 /
							range.push([cell.row - 1, cell.col]);
						else
							range.push([cell.row - 1, cell.col - 1])
					}
					else if (slope > 45 && slope <= 90) // 右下 67.5°
					{
						if (cell.evenRow) // 偶数行 /
							range.push([cell.row + 1, cell.col + 1]);
						else
							range.push([cell.row + 1, cell.col])
					}
					else if (slope > 90 && slope < 135) // 左下 67.5°
					{
						if (cell.evenRow) // 偶数行 \
							range.push([cell.row + 1, cell.col]);
						else
							range.push([cell.row + 1, cell.col - 1])
					}
				}

				for (let i = 0; i < range.length; i++) {
					let r = range[i];
					if (r[0] >= this.mesh.rows || r[0] < 0 || r[1] < 0 || r[1] >= this.mesh.cols)
						continue;
					
					if (!this.mesh.blank(r[0], r[1]) || this.mesh.evenLast(r[0], r[1]))
						continue;
					
					return {
						rayIndex,
						cell: this.mesh.cell(r[0], r[1]),
					};
				}
				
			} else { // 没有找到交点
				ray = rays[rayIndex + 1];
				if (ray && ray.start.y - this.rect.y - this.radius < 0.0001) // 在顶部
				{
					for (let index of this.mesh.colsEntries())
					{
						cell = this.mesh.cell(index);
						if (!cell.blank)
							continue;
						circlePoint = this.getCirclePos(cell.index);
						if (ray.intersectsCircle(new sharp.Circle(circlePoint, this.radius)).length > 0)
							return {
								rayIndex: rayIndex,
								cell: cell,
							};
					}
					return result;
				}
			}
		}
		// 最后一行，或者没值 则表示挂
		return result;
	}

	/**
	 * 圆心轨迹，均为绝对坐标
	 */
	public circleTraces(rays: sharp.Ray[], intersection: IntersectsBubble): sharp.Point[]
	{
		let	points: sharp.Point[] = [rays[0].start];
		if (!intersection.cell) // game over
			return points;
		for(let i = 1; i <= intersection.rayIndex; ++i)
			points.push(rays[i].start);
		let lastLine = new sharp.Line(points[points.length - 1], rays[intersection.rayIndex].start);

		let rect = this.getCellRectangle(intersection.cell.index),
			p = this.localToGlobal(rect.centerPoint.x, rect.centerPoint.y); // 转换为stage坐标

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
		let bubble: ui.BubbleUI = new ui.BubbleUI(cell);
		bubble.anchorOffsetX = this.radius;
		bubble.anchorOffsetY = this.radius;
		bubble.width = this.diameter;
		bubble.height = this.diameter;
		bubble.name = "cell";
		return bubble;
	}

	public createBubbleUI(cell: Cell)
	{
		let rect: sharp.Rectangle = this.getCellRectangle(cell.index);
		let bubble: ui.BubbleUI = new ui.BubbleUI(cell);
		bubble.x = rect.x;
		bubble.y = rect.y;
		bubble.width = rect.width;
		bubble.height = rect.height;
		bubble.name = "cell";
		return bubble;
	}
}