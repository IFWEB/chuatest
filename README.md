 *@discription 地址选择插件，基于$和$.extend https://github.com/IFWEB/mobile-select-area-nfd.git  
 *实例化var selectArea = new MobileSelectArea();  
 *初始化 selectArea.init(data);  
 *@param data {Object} 初始化参数  
 	data.trigger {jQDom} input节点，点击触发展示地址选择框,选择结果会在该节点上的data-value上体现，如data-value="1,1,2"  
 	data.separator {String} input的内容展示的分隔符，默认为" "，如"湖南省 长沙市"   
    data.data {Array} 节点数据,形如  
```
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
```
    data.default {Number} 0|1，默认值为0； 0表示没有默认选项，用"——"代替，1表示有默认选项，默认选中第一个。  
    data.level: {Number} 级别数，默认是3级的,最大3级,省、市、区。  
    data.value {Arrar[Number]} 初始值,默认三级值[0, 0, 0];  
    data.position: {String},当这个值为"bottom"时，弹层固定显示在底部，不传时居中显示,默认居中.  
    data.callback: {Function($scroller,text,value)} 选中后的回调;传参第一个是容器，第二个是选中后的text值，第三个参数是选中后的id。并且this指向当前对象。  默认有填充trigger的value值，以及赋值它后面紧跟着的hidden的value值，以逗号分隔id，空格分隔文字  
	data.eventName {String} tap|click,触发事件名称，默认click,使用zeptojs的可以用tap事件  
	data.showSize {Number} 一屏展示的地址条数，默认为5条  
  
 @interface show {Function} 展示地址选择框，selectArea.show();  
 @interface cancel {Function} 取消选择，保持原来的值 selectArea.cancel()  
 @interface yes {Function} 触发设置当前选中的地址，selectArea.yes()  
 @interface reset {Function} 将选择置为初始化状态，即调用selectArea.init时的状态  