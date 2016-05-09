/* Controllers */

angular.module('tilesIde.controllers', [])

.controller('ContentCtrl', ['$scope', 'userId', 'appRecipes', 'content', 'mainSidebar', function($scope, userId, appRecipes, content, mainSidebar){
	var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setShowPrintMargin(false);
    content.setEditor(editor);

    $scope.msb = mainSidebar;

    $scope.consoleInput = '';

	$scope.saveAppRecipe = function(appRecipe){
		appRecipe.code = content.editor.getValue();
		appRecipes.save(userId, appRecipe);
	}

	$scope.activateApp = function(appRecipe, activate){
		appRecipes.setActive(userId, appRecipe, activate);
	}

	$scope.deleteAppRecipe = function(appRecipe){
		appRecipes.delete(userId, appRecipe);
		$scope.msb.selectedAppRecipe = null;
	}

	$scope.openConfigEditor = function(appRecipe) {
		$('#configEditorModal').modal('show');
	}

	$scope.sendConsoleInput = function(appRecipe) {
		var input = $scope.consoleInput + '\n';
		sendConsoleInput(appRecipe._id, input);
		addConsoleEntry('appConsole', input, 'user-input');
		$scope.consoleInput = '';
	}
}])
.controller('MainSidebarCtrl', ['$scope', 'userId', 'appRecipes', 'mainSidebar', 'content', 'controlSidebar', function($scope, userId, appRecipes, mainSidebar, content, controlSidebar){
	$scope.appRecipes = appRecipes.appRecipes;
	$scope.controlSidebar = controlSidebar;

	$scope.$on('$viewContentLoaded', function() {
		$('#appRecipeList').slimScroll({
			height: '640px',
			color: '#ecf0f5'
		});
	});

	function setAsSelected(appRecipe){
		for (var i=0; i<$scope.appRecipes.length; i++){
			$scope.appRecipes[i].selected = false;
		}
		appRecipe.selected = true;
		mainSidebar.selectedAppRecipe = appRecipe;
		clearConsole('appConsole');
		setAppConsoleSocketRoom(appRecipe._id);
	}

	$scope.showAppRecipe = function(appRecipe){
		if (appRecipe.selected) return;
		setAsSelected(appRecipe);
		appRecipes.getCode(userId, appRecipe, function(res){
			var code = res.data;
			content.editor.setValue(code);
		});
	}
}])
.controller('ControlSidebarCtrl', ['$scope', 'userId', 'controlSidebar', 'tiles', 'tileConsole', function($scope, userId, controlSidebar, tiles, tileConsole){
	$scope.controlSidebar = controlSidebar;
	$scope.tiles = tiles.tiles;
	tiles.initRealTimeUpdates(userId, function(){
		$scope.$apply();
	});

	$scope.showTileConsoleModal = function(tile) {
		tileConsole.setTile(tile);
		$('#tileConsoleModal').modal('show');
	}
}])
.controller('HeaderCtrl', ['$scope', 'userId', 'controlSidebar', function($scope, userId, controlSidebar){
	$scope.userId = userId;
	$scope.controlSidebar = controlSidebar;
}])
.controller('FooterCtrl', ['$scope', function($scope){

}])
.controller('CreateAppModalCtrl', ['$scope', 'userId', 'appRecipes', function($scope, userId, appRecipes){
	var defaults = {
		name: '',
		programmingLanguage: 'JavaScript',
		templateName: 'Standard',
		template: {
			connectToServer: true,
			setTargetGroup: true,
			evtConnectedToServer: true,
			evtMsgReceived: true,
			evtDeviceConnected: true,
			evtDeviceDisconnected: true
		}
	}

	// Clone the 'defaults' object to provide a mutable object for the view
	$scope.newAppRecipe = JSON.parse(JSON.stringify(defaults));

	$scope.createAppRecipe = function(){
		if (!$scope.newAppRecipe.name || $scope.newAppRecipe.name === '') return;

		// Hide modal
		$('#createAppModal').modal('hide');

		// Create app
		appRecipes.create(userId, $scope.newAppRecipe);

		// Reset form by cloning 'defaults' object
		$scope.newAppRecipe = JSON.parse(JSON.stringify(defaults));
	}

	$scope.templateSelectionChanged = function(){
		// Uncheck all sections initially
		$scope.newAppRecipe.template.connectToServer = false;
		$scope.newAppRecipe.template.evtMsgReceived = false;
		$scope.newAppRecipe.template.setTargetGroup = false;
		$scope.newAppRecipe.template.evtConnectedToServer = false;
		$scope.newAppRecipe.template.evtDeviceConnected = false;
		$scope.newAppRecipe.template.evtDeviceDisconnected = false;

		// Check sections to be included
		switch ($scope.newAppRecipe.templateName) {
			case 'Custom':
			case 'Standard':
				$scope.newAppRecipe.template.connectToServer = true;
				$scope.newAppRecipe.template.evtMsgReceived = true;
				$scope.newAppRecipe.template.setTargetGroup = true;
				$scope.newAppRecipe.template.evtConnectedToServer = true;
				$scope.newAppRecipe.template.evtDeviceConnected = true;
				$scope.newAppRecipe.template.evtDeviceDisconnected = true;
				break;
			case 'Minimal':
				$scope.newAppRecipe.template.connectToServer = true;
				$scope.newAppRecipe.template.evtMsgReceived = true;
				break;
		} 
	}

	$scope.templateSectionsChanged = function(){
		// Set template name to custom if a template section checkbox is modified by user
		$scope.newAppRecipe.templateName = 'Custom';
	}
}])
.controller('TileConsoleModalCtrl', ['$scope', 'tileConsole', function($scope, tileConsole){
	$scope.tileConsole = tileConsole;

	$('#tileConsoleModal').on('hidden.bs.modal', function () {
  		tileConsole.detachTile();
	})

	$scope.$watch('tileConsole.tile.group', function(newValue, oldValue) {
        if (typeof oldValue != 'undefined') tileConsole.changeGroup(newValue, oldValue);
    }, true);
}])
.controller('ConfigEditorModalCtrl', ['$scope', '$filter', 'configData', 'userId', 'mainSidebar', function($scope, $filter, configData, userId, mainSidebar){
	$scope.jsonData = {};
	$scope.showVisualEditor = true;

	$('#configEditorModal').on('shown.bs.modal', function (e) {
		configData.fetch(userId, mainSidebar.selectedAppRecipe, function(data){
			$scope.jsonData = data || {};
		});
	})

    $scope.$watch('jsonData', function(json) {
        $scope.jsonString = $filter('json')(json);
    }, true);

    $scope.$watch('jsonString', function(json) {
        try {
            $scope.jsonData = JSON.parse(json);
            $scope.isValidJson = true;
        } catch(e) {
            $scope.isValidJson = false;
        }
    }, true);

    $scope.saveConfigFile = function() {
		configData.save(userId, mainSidebar.selectedAppRecipe, $scope.jsonData);
    };
}]);;