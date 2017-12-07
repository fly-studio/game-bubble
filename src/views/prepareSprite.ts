namespace ui {

	export class PrepareSprite extends layer.ui.Sprite {

		protected bubbles: BubbleUI[];
		protected container: MeshContainer;

		constructor(container: MeshContainer)
		{
			super();
			this.container = container;
			this.bubbles = [];
		}

		public get prepareBubble(): BubbleUI {
			return this.bubbles[0];
		}

		public pushBubble(bubbleUI: BubbleUI) {
			this.bubbles.shift();
			this.bubbles.push(bubbleUI);

			bubbleUI.x = this.stage.stageWidth - bubbleUI.width / 2;
			bubbleUI.y = this.stage.stageHeight - bubbleUI.height / 2;
			this.addChild(bubbleUI);

			return this.moveBubbles();
		}

		protected moveBubbles()
		{
			let promises: Promise<any>[] = [];
			this.bubbles.forEach((bubble, i) => {
				promises.push(new Promise<any>(resolve => {
					egret.Tween.get(bubble).to({
						x: this.container.jetPoint.x + i * 120
					}, 10).call(() => {
						resolve();
					});
				}));
			})
			return Promise.all(promises);
		}

		public onAddedToStage(event: egret.Event) : void {

		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();

		}

		public removeAllEventListeners(): void {


		}
	}
}
