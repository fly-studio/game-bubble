namespace ui {
	export class GameUI extends layer.ui.Sprite {
		public mesh: Mesh;
		private meshSprite: MeshUI;

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
		}

		public onAddedToStage(event: egret.Event) : void {

			
		}

		public onRemovedFromStage(event: egret.Event): void {
			this.removeAllEventListeners();
		}

		public removeAllEventListeners(): void {

		}
		
		public start()
		{
			this.mesh.createMesh(_.range(32));

			this.buildMeshSprite();
		}

		public buildMeshSprite()
		{
			if (this.meshSprite) this.meshSprite.destroy();
			this.meshSprite = new MeshUI(this.mesh);
			this.meshSprite.width = this.width;
			this.meshSprite.height = this.height;
			this.addChild(this.meshSprite);
		}


	}
}