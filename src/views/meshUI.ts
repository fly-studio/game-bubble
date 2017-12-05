namespace ui {


	export class MeshUI extends layer.ui.Sprite {
		public colorList: number[];

		private container: MeshContainer;
		private mesh: Mesh;
		constructor(container: MeshContainer)
		{
			super();

			this.container = container;
			this.mesh = container.mesh;

			this.x = container.rect.x;
			this.y = container.rect.y;
			this.width = container.rect.width;
			this.height = container.rect.height;
		}

		public onAddedToStage(event: egret.Event): void
		{
			this.renderMesh();
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}

		public replaceBubbleUI(bubbleUI: BubbleUI)
		{
			let bubble = this.getChildByCellIndex(bubbleUI.cell.index);
			if (bubble instanceof BubbleUI)
			{
				bubble.cell = bubbleUI.cell;
				this.mesh.cells[bubbleUI.cell.index] = bubbleUI.cell;
				bubble.reRender();
			}
			bubbleUI.destroy();

		}

		public renderMesh() : void
		{
			this.removeChildren();

			for(let index of this.mesh.indicesEntries()) {
				let cellUI: BubbleUI = this.container.createBubbleUI(this.mesh.cell(index));
				this.addChild(cellUI);
			}
		}

		public getChildByCellIndex(index: number) : BubbleUI|null {
			for (let i = 0; i < this.numChildren; i++) {
				let element: BubbleUI = this.getChildAt(i) as BubbleUI;
				if (element.name != 'cell') continue;
				if (element.cell && element.cell.index == index)
					return element;
			}
			return null;
		}

		public renderCrush(group: CrushedGroup)
		{
			let promises: Promise<any>[] = [];
			group.cellIndices.forEach(index => {
				let ui = this.getChildByCellIndex(index);
				if (ui instanceof BubbleUI)
					promises.push(ui.disappear());
			});

			return Promise.all(promises);
		}

		public renderDroping(dropingIndices: number[])
		{
			let promises: Promise<any>[] = [];
			dropingIndices.forEach(index => {
				let ui = this.getChildByCellIndex(index);
				if (ui instanceof BubbleUI)
					promises.push(ui.drop());
			});

			return Promise.all(promises);
		}
	}
}
