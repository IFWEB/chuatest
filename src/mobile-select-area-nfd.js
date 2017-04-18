/*
 * Created with Sublime Text 2.
 * User: chua
 * Date: 2017-04-14

 *@discription 地址选择插件(在田想兵的mobile-select-area基础上修改完善.)，基于$和$.extend https://github.com/IFWEB/mobile-select-area-nfd.git
 基于dialog.js,dialog.scss,mobile-select-area-nfd.css
 *实例化var selectArea = new MobileSelectArea();
 *初始化 selectArea.init(data);
 *@param data {Object} 初始化参数
 	data.trigger {jQDom} input节点，点击触发展示地址选择框,选择结果会在该节点上的data-value上体现，如data-value="1,1,2"
 	data.separator {String} input的内容展示的分隔符，默认为" "，如"湖南省 长沙市" 
    data.data {Array} 节点数据,形如
    	data = [{
	        "id": 1,
	        "name": "浙江省",
	        "child": [{
	            "id": "1",
	            "name": "杭州市",
	            "child": [{
	                "id": 1,
	                "name": "滨江区"
	            }]
	        }]
	    }];
    data.default {Number} 0|1，默认值为0； 0表示没有默认选项，用"——"代替，1表示有默认选项，默认选中第一个。
    data.level: {Number} 级别数，默认是3级的,最大3级,省、市、区。
    data.value {Arrar[Number]} 初始值,默认三级值[0, 0, 0];
    data.position: {String},当这个值为"bottom"时，弹层固定显示在底部，不传时居中显示,默认居中.
    data.callback: {Function($scroller,text,value)} 选中后的回调;传参第一个是容器，第二个是选中后的text值，第三个参数是选中后的id。并且this指向当前对象。默认有填充trigger的value值，以及赋值它后面紧跟着的hidden的value值，以逗号分隔id，空格分隔文字
	data.eventName {String} tap|click,触发事件名称，默认click,使用zeptojs的可以用tap事件
	data.showSize {Number} 一屏展示的地址条数，默认为5条

 @interface show {Function} 展示地址选择框，selectArea.show();
 @interface cancel {Function} 取消选择，保持原来的值 selectArea.cancel()
 @interface yes {Function} 触发设置当前选中的地址，selectArea.yes()
 @interface reset {Function} 将选择置为初始化状态，即调用selectArea.init时的状态
 

;*/
(function(root, factory) {
	//amd
	if (typeof define === 'function' && define.amd) {
		define([ "jquery",'dialog' ], factory );
	} else if (typeof define === 'function' && define.cmd) {
		define(function(require, exports, module) {
			var $ = require("jquery");
			var Dialog = require("dialog");
			return factory($, Dialog);
		});
	} else if (typeof exports === 'object') { //umd
		module.exports = factory();
	} else {
		root.MobileSelectArea = factory($);
	}
})(this, function($, Dialog) {
	var MobileSelectArea = function() {
		var rnd = Math.random().toString().replace('.', '');
		this.id = 'scroller_' + rnd;
		this.$scroller;
		this.data;
		this.index = 0;
		this.value = [0, 0, 0];
		this.oldvalue;
		this.oldtext = [];
		this.text = ['', '', ''];
		this.level = 3;
		this.mtop = 30;//初始化的时候的margin-top
		this.itemHeight = 30;//每一个地址容器高度，默认30表示30px
		this.separator = ' ';
		this.showSize = 5;
		this.diff = 0;//表示差值 = 真实展示的条数 - 数据条数。因为如果没有默认选中值，那么第一条数据是无效数据，使用"——"展示
	};
	MobileSelectArea.prototype = {
		init: function(settings) {
			this.settings = $.extend({
				eventName: 'click'
			}, settings);
			this.$trigger = $(this.settings.trigger);
			this.settings.default == undefined ? 0: this.default;//0表示没有默认选项，用"——"代替，1表示有默认选项，默认选中第一个
			this.diff = this.settings.default? 0: 1;
			level = parseInt(this.settings.level);
			this.level = level > 0 ? level : 3;
			this.$trigger.attr("readonly", "readonly");
			this.clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
			this.clientWidth = document.documentElement.clientWidth || document.body.clientWidth;
			// this.promise = this.getData();
			this.showSize = this.settings.showSize || this.showSize;
			this._initData();
			this.bindEvent();
		},
		_initData: function(){
			//设置出事默认值
			if(this.diff == 0){//表示需要默认值
				var value = '',text = '',
					item = this.settings.data;
				for(var i = 0; i < this.level; i++){
					if(i == 0){
						text += item[0].name;
						value += item[0].id;
					}else{
						text += ' ' + item[0].name;
						value += ',' + item[0].id;
					}					
					item = item[0].child;
				}
				this.settings.value = this.settings.value || value;
				this.settings.text = this.settings.text || (this.$trigger.val() && this.$trigger.val().split(' ')) || text.split(' ');
			}else{				
				this.settings.value = this.settings.value || '0,0,0';
				this.settings.text = this.settings.text || (this.$trigger.val() && this.$trigger.val().split(' ')) || ['', '', ''];
			}
			this.value =  this.settings.value.split(",");
			this.text = $.extend([],this.settings.text);
			//根据级数裁剪
			this.value.length = this.text.length = this.level;
			this.oldvalue = this.value.concat([]);
			this.oldtext = this.text.concat([]);
		},
		getData: function() {
			var _this = this;
			var dtd = $.Deferred();
			if (typeof this.settings.data == "object") {
				this.data = this.settings.data;
				dtd.resolve();
			} else {
				$.ajax({
					dataType: 'json',
					cache: true,
					url: this.settings.data,
					type: 'GET',
					success: function(result) {
						_this.data = result.data;
						dtd.resolve();
					},
					accepts: {
						json: "application/json, text/javascript, */*; q=0.01"
					}
				});
			}
			return dtd;
		},
		show:function(){
			var _this = this;
			var dlgContent = '';
			var diliver = 100/_this.level;
				for (var i = 0; i < _this.level; i++) {
					dlgContent += '<div style="width:'+diliver+'%"></div>';
				};
				var settings, buttons;
				if (_this.settings.position == "bottom") {
					settings = {
						position: "bottom",
						width: "100%",
						className: "ui-dialog-bottom",
						animate: false
					}
					var buttons = [{
						'no': '取消'
					}, {
						'yes': '确定'
					}];
				}
				$.confirm('<div class="ui-scroller-mask"><div id="' + _this.id + '" class="ui-scroller">' + dlgContent + '</div></div>', buttons, function(t, c) {
					if (t == "yes") {
						_this._submit()
					}
					if (t == 'no') {
						_this.cancel();
					}
					this.dispose();
				}, $.extend({
					width: 320,
					height: 215
				}, settings));
				_this.itemHeight = $('#' + _this.id + '>div').height()/this.showSize;//this.settings.itemHeight || this.itemHeight;
				_this.mtop = (this.showSize - 1)*this.itemHeight/2;
				_this.$scroller = $('#' + _this.id);
				_this.getData().done(function() {
					_this.format();
				});
		},
		bindEvent: function() {
			var _this = this;
			this.$trigger[_this.settings.eventName](function(e) {
				_this.show();
				var start = 0,
					end = 0
				_this.$scroller.children().bind('touchstart', function(e) {
					start = (e.changedTouches || e.originalEvent.changedTouches)[0].pageY;
				});
				_this.$scroller.children().bind('touchmove', function(e) {
					end = (e.changedTouches || e.originalEvent.changedTouches)[0].pageY;
					var diff = end - start;
					var dl = $(e.target).parent();
					if (dl[0].nodeName != "DL") {
						return;
					}
					var top = parseInt(dl.css('top') || 0) + diff;
					dl.css('top', top);
					start = end;
					return false;
				});
				_this.$scroller.children().bind('touchend', function(e) {
					end = (e.changedTouches || e.originalEvent.changedTouches)[0].pageY;
					var diff = end - start;
					var dl = $(e.target).parent();
					if (dl[0].nodeName != "DL") {
						return;
					}
					var i = $(dl.parent()).index();
					var top = parseInt(dl.css('top') || 0) + diff;
					if (top > _this.mtop) {
						top = _this.mtop;
					}
					if (top < -$(dl).height() + (_this.showSize + 1)*_this.itemHeight/2) {//当最后一个元素展示在焦点位置阻止继续上滑
						top = -$(dl).height() + (_this.showSize + 1)*_this.itemHeight/2;
					}

					var mod = top / _this.itemHeight;
					var mode = Math.round(mod);

					var index = Math.abs(mode - (_this.showSize - 1)/2);//Math.abs(mode) + 1;剔除掉mtop上面的占位
					// if (mode == 1) {
					// 	index = 0;
					// }
					_this.value[i] = $(dl.children().get(index)).attr('ref');
					_this.value[i] == 0 ? _this.text[i] = "" : _this.text[i] = $(dl.children().get(index)).html();
					if (!$(dl.children().get(index)).hasClass('focus')) {
						for (var j = _this.level - 1; j > i; j--) {
							_this.value[j] = 0;
							_this.text[j] = "";
						}
						// _this.format();

						var item = _this.data;
						//遍历找到当前滑动到的元素的child数据
						for(var n = 0; n <= i; n++){
							for(var m = 0; m < item.length; m++){
								if(item[m].id == _this.value[n]){//找到第n级目录对应的数据，取出其child数据
									item = item[m].child;
									break;
								}
							}
						}
						//遍历结束以后item就是第i级滑块的child数据
						_this.index = i + 1;//指定要重新加载_this.index级的地址数据
						_this.f(item);
						
					}
					$(dl.children().get(index)).addClass('focus').siblings().removeClass('focus');
					dl.css('top', mode * _this.itemHeight);
					return false;
				});
				return false;
			});
		},
		format: function() {
			var _this = this;
			var child = _this.$scroller.children();
			this.f(this.data);
			console.log(_this.text)
		},
		f: function(data) {
			var _this = this;
			var item = data;
			if (!item) {
				item = [];
			};
			var str = '<dl><dd ref="0">——</dd>';
			var focus = 0,
				childData, top = _this.mtop;
			if (_this.index !== 0 && _this.value[_this.index - 1] == "0" && this.diff == 1) {
				str = '<dl><dd ref="0" class="focus">——</dd>';
				_this.value[_this.index] = 0;
				_this.text[_this.index] = "";
				focus = 0;
			} else {
				if (_this.value[_this.index] == "0") {
					str = '<dl><dd ref="0" class="focus">——</dd>';
					focus = 0;
				}
				if (item.length > 0 && this.diff == 0) {
					str = '<dl>';
					var pid = item[0].pid || 0;
					var id = item[0].id || 0;
					focus = item[0].id;
					childData = item[0].child;
					if (!_this.value[this.index]) {
						_this.value[this.index] = id;
						_this.text[this.index] = item[0].name;
					}
					// str += '<dd pid="' + pid + '" class="' + cls + '" ref="' + id + '">' + item[0].name + '</dd>';
				}
				for (var j = 0, len = item.length; j < len; j++) {
					var pid = item[j].pid || 0;
					var id = item[j].id || 0;
					var cls = '';
					if (_this.value[_this.index] == id) {
						cls = "focus";
						focus = id;
						childData = item[j].child;
						//j是数据的序号，节点序号和数据的序号之间差值是_this.diff
						top = _this.itemHeight*(-(j + _this.diff - (_this.showSize - 1)/2));//_this.itemHeight * (-(j - _this.default));
					};
					str += '<dd pid="' + pid + '" class="' + cls + '" ref="' + id + '">' + item[j].name + '</dd>';
				}
			}
			str += "</dl>";
			var newdom = $(str);
			newdom.css('top', top);
			var child = _this.$scroller.children();
			$(child[_this.index]).html(newdom);
			_this.index++;
			if (_this.index > _this.level - 1) {
				_this.index = 0;
				return;
			}
			_this.f(childData);
		},
		_submit: function() {
			this.yes();
			this.settings.callback && this.settings.callback.call(this, this.$scroller, this.text, this.value);
		},
		yes: function(){			
			this.oldvalue = this.value.concat([]);
			this.oldtext = this.text.concat([]);
			if (this.$trigger[0].nodeType == 1) {
				//input
				this.$trigger.val(this.text.join('') && this.text.join(this.separator));//有选择内容才写入内容
				this.$trigger.attr('data-value', this.text.join('') && this.value.join(','));//有选择内容才写入内容
			}
			this.$trigger.next(':hidden').val(this.value.join(','));
		},
		cancel: function() {
			this.value = this.oldvalue.concat([]);
			this.text = this.oldtext.concat([]);
		},
		reset: function(){
			this._initData();
			this.yes();
		}
	};
	return MobileSelectArea;
});