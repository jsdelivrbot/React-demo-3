require('./_sell-2.scss');

var $s = require('scriptjs');
$s('/lib/ckeditor/ckeditor.js', function(){
    CKEDITOR.replace('item_desc', {
        //extraPlugins: 'uploadimage',
        height: '30rem',
        uploadUrl : '/sell/2/uploadDescriptionPhoto?type=pasted',
        //filebrowserBrowseUrl: '/browser/browse.php',
        filebrowserUploadUrl: '/sell/2/uploadDescriptionPhoto?type=filebrowser',
        image_previewText : " "
    });
});

var React = require('react');
var ReactDOM = require('react-dom');
var ReactAddonsUpdate = require('react-addons-update');
var PubSub = require('pubsub-js');

var emptyTemplate ={
    id_: '',
    name_: '',
    is_default_: 0,
    shipping_template_item: []
};

var emptyItem ={
    id_: '',
    option_: '',
    fee_: '',
    extra_fee_: ''
};

var newItemCounter=0;

var SFaddbutton = React.createClass({
    openAddForm: function() {
        PubSub.publish('editingTemplate', emptyTemplate);
    },

    render: function() {
        return (
            <button type="button" id="addNew" className="button b2red float-right tiny" onClick={this.openAddForm}>Add Template</button>
        );
    }
});
var SFeditbutton = React.createClass({
    openEditForm: function() {
        PubSub.publish('editingTemplate', this.props.currentTemplate);
    },

    render: function() {
        return (
            <button type="button" id="editTemplate" className="button b2darkyellow float-right tiny" onClick={this.openEditForm}>Edit Template</button>
        );
    }
});

var SFtemplate = React.createClass({
    getInitialState: function() {
        return {
            templates : [],
            currentTemplateId : currentTemplateId
        };
    },

    loadTemplatesFromServer: function() {
        $.ajax({
            url: "/sell/2/loadtemplates",
            dataType: 'json',
            success: function(data) {
                this.setState({templates: data});
                if(!this.state.currentTemplateId && data.length!=0)
                {
                    this.setState({currentTemplateId: data[0].id_});
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error("/sell/2/loadtemplates", status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function() {
        this.loadTemplatesFromServer();
    },

    componentWillMount: function() {
        this.pubsub_token = PubSub.subscribe('templateUpdated', function(topic, templateId) {
            this.loadTemplatesFromServer();
            this.setState({currentTemplateId: templateId});
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe(this.pubsub_token);
    },

    handleSelect: function(event) {
        this.setState({currentTemplateId: event.target.value});
    },

    render: function() {
        var options = [];
        var SFitems = [];
        var localTemplateId = this.state.currentTemplateId;
        var currentTemplate = [];

        this.state.templates.forEach(function(currentValue, index){
            options.push(<option key={currentValue.id_} value={currentValue.id_}>{currentValue.name_}</option>);

            if(localTemplateId && currentValue.id_ == localTemplateId)
            {
                currentTemplate = currentValue;
            }
        });

        if(typeof currentTemplate.shipping_template_item != 'undefined')
        {
            currentTemplate.shipping_template_item.forEach(function(currentValue, index){
                SFitems.push(
                    <tr key={currentValue.id_}>
                        <td>{currentValue.option_}</td>
                        <td>{currentValue.fee_}</td>
                        <td>{currentValue.extra_fee_}</td>
                    </tr>
                );
            });
        }

        return (
            <div className="react-div">
                <SFeditbutton currentTemplate={currentTemplate}/>
                <SFaddbutton />
                <select id="shippingTemp" name="shippingId" value={this.state.currentTemplateId} onChange={this.handleSelect}>
                    {options}
                </select>
                    <table id="shipFeeTable">
                    <thead>
                    <tr>
                        <th id="shipArea">Region</th>
                        <th id="shipFee">Shipping Fee(NZD)</th>
                        <th id="extraFee">Extra Fee(NZD)</th>
                    </tr>
                    </thead>
                    <tbody>
                        {SFitems}
                    </tbody>
                </table>
            </div>
        );
    }
});

var EditTemplateModal = React.createClass({
    getInitialState: function() {
        return {currentTemplate: emptyTemplate};
    },

    handleFormSubmit: function(event) {
        event.preventDefault();
        $.ajax({
            url: '/sell/2/updatetemplate',
            method: 'POST',
            data: this.state.currentTemplate,
            success: function(data) {
                PubSub.publish('templateUpdated', this.state.currentTemplate.id_);
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        $('#shippingTemplateModal').foundation('close');
    },

    handleFormClose: function(event) {
        $('#shippingTemplateModal').foundation('close');
    },

    componentWillMount: function() {
        this.pubsub_token = PubSub.subscribe('editingTemplate', function(topic, template) {
            this.setState({currentTemplate: template});

            $('#shippingTemplateModal').foundation('open');
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe(this.pubsub_token);
    },

    handleTemplateInput: function(event) {
        var updatedState = ReactAddonsUpdate(
            this.state.currentTemplate,
            {
                name_: {$set: event.target.value}
            }
        );
        this.setState({currentTemplate: updatedState});
    },

    handleTemplateItemInput: function(event) {
        var itemId = $(event.target).parent().parent().attr('data-id');
        var index = this.state.currentTemplate.shipping_template_item.findIndex(function(element){ return element.id_==itemId });
        var field = event.target.name;

        var updatedState = ReactAddonsUpdate(
            this.state.currentTemplate,
            {
                shipping_template_item: {
                    [index]: {
                        [field]: {$set: event.target.value}
                    }
                }
            }
        );
        this.setState({currentTemplate: updatedState});
    },

    addNewItem: function(event) {
        var tempItem = $.extend(true, {}, emptyItem);
        tempItem.id_ = 'temp_' + newItemCounter++;

        var updatedState = ReactAddonsUpdate(
            this.state.currentTemplate,
            {
                shipping_template_item: {
                    $push: [tempItem]
                }
            }
        );
        this.setState({currentTemplate: updatedState});
    },

    deleteItem: function(event) {
        var itemId = $(event.target).parent().parent().parent().attr('data-id');

        var updatedState = ReactAddonsUpdate(
            this.state.currentTemplate,
            {
                shipping_template_item: {
                    $splice: [[this.state.currentTemplate.shipping_template_item.findIndex(function(element){ return element.id_== itemId}),1]]
                }
            }
        );
        this.setState({currentTemplate: updatedState});
    },

    render: function() {
        var SFitems = [];
        var reactObj = this;

        if(!$.isEmptyObject(this.state.currentTemplate))
        {
            this.state.currentTemplate.shipping_template_item.forEach(function(currentValue, index){
                SFitems.push(
                    <tr key={currentValue.id_} className="shipFeeTrModal" data-id={currentValue.id_}>
                        <td><input type="text" className="skipFeeInput" name="option_" value={currentValue.option_} onChange={reactObj.handleTemplateItemInput} /></td>
                        <td><input type="text" className="skipFeeInput" name="fee_" value={currentValue.fee_} onChange={reactObj.handleTemplateItemInput} /></td>
                        <td><input type="text" className="skipFeeInput" name="extra_fee_" value={currentValue.extra_fee_} onChange={reactObj.handleTemplateItemInput} /></td>
                        <td><button type="button" className="eraseTr" onClick={reactObj.deleteItem}><img src="/img/sell-img/erase.png" /></button></td>
                    </tr>
                );
            });
        }

        return (
            <form onSubmit={this.handleFormSubmit}>
                <table id="shipFeeTableModal">
                    <tbody>
                        <tr>
                            <td colSpan="1">Template Name</td>
                            <td colSpan="3">
                                <input type="text" className="skipFeeInput" name="name_" value={this.state.currentTemplate.name_} onChange={this.handleTemplateInput} />
                                <input type="hidden" id="templateId" value={this.state.currentTemplate.id_} onChange={this.handleTemplateInput}/>
                            </td>
                        </tr>
                        <tr>
                            <th id="shipArea">Region</th>
                            <th id="shipFee">Shipping Fee(NZD)</th>
                            <th id="extraFee">Extra Fee(NZD)</th>
                            <th id="settingTH"><img src="/img/sell-img/setting.png"/></th>
                        </tr>
                        {SFitems}
                    </tbody>
                </table>
                <div id="add_del"> <button type='button' onClick={this.addNewItem}>Add Region</button></div>

                <div>
                    <button type="submit" className="button b2red float-center">Save</button>
                </div>
                <button className="close-button" onClick={this.handleFormClose} aria-label="Close modal" type="button">
                    <span aria-hidden="true">&times;</span>
                </button>
            </form>
        );
    }
});

ReactDOM.render(
    <SFtemplate />,
    document.getElementById('shippingFeeReactContainer')
);

ReactDOM.render(
    <EditTemplateModal />,
    document.getElementById('shippingTemplateModal')
);
/**
 * Created by jianghaibo on 11/05/16.
 */

//function initPaymentSupport(payStr){
//    var paySupports = payStr.split(':');
//    for(var i = 0; i < paySupports.length; i++ ){
//        $('#' + paySupports[i]).attr('checked', true);
//    }
//}
//
//$(function(){
//    var dataformInit = $("#basicInfoForm").serializeArray();
//    var jsonTextInit = JSON.stringify({ dataform: dataformInit });
//    $("#next").click(function(){
//        var dataform = $("#basicInfoForm").serializeArray();
//        var jsonText = JSON.stringify({ dataform: dataform });
//        if(jsonTextInit==jsonText) {
//            $('#dataChanged').val(0);
//        }else{
//            $('#dataChanged').val(1);
//        }
//        $("#basicInfoForm").attr("action", "/sell/basicSubmit?type=next");
//        $("#basicInfoForm").attr("method", "post");
//        $("#basicInfoForm").submit();
//    });
//
//    $("#pre").click(function(){
//        var dataform = $("#basicInfoForm").serializeArray();
//        var jsonText = JSON.stringify({ dataform: dataform });
//        if(jsonTextInit==jsonText) {
//            $('#dataChanged').val(0);
//        }else{
//            $('#dataChanged').val(1);
//        }
//        $("#basicInfoForm").attr("action", "/sell/basicSubmit?type=pre");
//        $("#basicInfoForm").attr("method", "post");
//        $("#basicInfoForm").submit();
//    })
//
//    sell2();
//})

//window.onload = function ()
//{
//        CKEDITOR.replace('editor1');
//}

$(function(){
    $("#shipFee1, #shipFee2").click(function()
    {
        $(".extraShipFee").slideUp();
    });

    $("#shipFee3").click(function()
    {
        $(".extraShipFee").slideDown();
    });

    //var dataformInit = $("#itemDetailForm").serializeArray();
    //var jsonTextInit = JSON.stringify({ dataform: dataformInit });
    //$("#next").click(function(){
    //    var dataform = $("#itemDetailForm").serializeArray();
    //    var jsonText = JSON.stringify({ dataform: dataform });
    //    if(jsonTextInit==jsonText) {
    //        $('#dataChanged').val(0);
    //    }else{
    //        $('#dataChanged').val(1);
    //    }
    //    $("#itemDetailForm").attr("action", "/sell/detailSubmit?type=next");
    //    $("#itemDetailForm").attr("method", "post");
    //    $("#itemDetailForm").submit();
    //});
    //
    //$("#pre").click(function(){
    //    var dataform = $("#itemDetailForm").serializeArray();
    //    var jsonText = JSON.stringify({ dataform: dataform });
    //    if(jsonTextInit==jsonText) {
    //        $('#dataChanged').val(0);
    //    }else{
    //        $('#dataChanged').val(1);
    //    }
    //    $("#itemDetailForm").attr("action", "/sell/detailSubmit?type=pre");
    //    $("#itemDetailForm").attr("method", "post");
    //    $("#itemDetailForm").submit();
    //});

    //if($("#shipFeeTable .shipFeeTr").length == 0){
    //    if($("#shippingTemp").find(":first-child")){
    //        var shippingTemplateId = $("#shippingTemp").find(":first-child").attr('value');
    //        getTemplateItems(shippingTemplateId);
    //    }
    //}

    if(window.ship_fee_type_ != 'free' )
    {
        $(".extraShipFee").slideDown();
    }
    else
    {
        $(".extraShipFee").hide();
    }
});

// $('#city').change(function(){
//
//     $.ajax({
//         method: "GET",
//         url: "/regions/" + $(this).val(),
//         dataType : "json"
//         })
//         .done(function(districts) {
//             $("#district").empty();
//             $("#district").append('<option value="-1">All districts</option>');
//             for(var offset = 0; offset < districts.length; offset++){
//                 $("#district").append('<option value="' + districts[offset].id_ + '">' + districts[offset].name_ + '</option>');
//             }
//         });
// });



