			var gestureDragStart, gestureDragUp, gestureDragDown, gestureDragEnd;
                function init() {
                    setTimeout(function () {
                        gestureDragStart = $ionicGesture.on('dragstart', panstart, $('#your_content_id'), { prevent_default_directions: ['left', 'right', 'up', 'down'] });
                        gestureDragUp = $ionicGesture.on('dragup', dragup, $('#your_content_id'), { prevent_default_directions: ['left', 'right', 'up', 'down'] });
                        gestureDragDown = $ionicGesture.on('dragdown', dragdown, $('#your_content_id'), { prevent_default_directions: ['left', 'right', 'up', 'down'] });
                        gestureDragEnd = $ionicGesture.on('dragend', dragend, $('#your_content_id'), { prevent_default_directions: ['left', 'right', 'up', 'down'] });
                    });
                }

                init();

				function refresh(){
					setTimeout(function(){
						//simulate refresh here..
						//do something should..
					},1000);
				}
				
                function panstart(e) {
                    WebPullToRefresh.panStart(e);
                }

                function dragdown(e) {
                    if ($('#your_content_id').scrollTop() == 0) WebPullToRefresh.panDown(e);
                }

                function dragup(e) {
                    WebPullToRefresh.panUp(e);
                }

                function dragend(e) {
                    WebPullToRefresh.panEnd(e);
                }

                setTimeout(function () {
                    WebPullToRefresh.init({
                        loadingFunction: refresh,
                        contentEl: 'your_content_id'
                    });
                }, 500);