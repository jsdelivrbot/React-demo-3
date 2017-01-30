require('./order_confirm.scss');
require('component/address.js');

var React = require('react');
var ReactDOM = require('react-dom');
var ReactAddonsUpdate = require('react-addons-update');
var PubSub = require('pubsub-js');
var classnames = require('classnames');
var AddressForm = require('component/addressForm/addressForm.jsx');

var emptyAdd = {
    id: '',
    Receiver: '',
    Address: '',
    Phone: '',
    Memo: '',
    Is_Default: true
};

var AddressCard = React.createClass({

    openEditForm: function() {
        PubSub.publish('editingAdd', this.props.address);
    },

    selectAdd: function() {
        this.props.onUserSelectAdd(this.props.address.id);
    },

    render: function() {
        var editLink;
        var sendTo;
        if(this.props.selected) {
            editLink = <span className="float-right"><a className="button b2darkyellow tiny" onClick={this.openEditForm}>Edit Address</a></span>
            sendTo = <span className="float-right sendto">Send To:</span>
        }

        return (
            <li className={this.props.selected?'selected':''} onClick={this.selectAdd}>
                <div className="row">
                    <div className="column small-1">{sendTo}</div>
                    <div className="column small-11 addr_info">
                        <input type="radio" name="address" value={this.props.address.id} id={'addr_'+this.props.address.id} checked={this.props.selected} required="true" />
                        <label htmlFor={'addr_'+this.props.address.id}>{this.props.address.Receiver} ({this.props.address.Address}) {this.props.address.Phone}&nbsp;&nbsp;&nbsp;{this.props.address.Is_Default?'Default':''}</label>
                        {editLink}
                    </div>
                </div>
            </li>
        );
    }
});

var AddressList = React.createClass({
    getInitialState: function() {
        return {
            adds: [],
            selected: ''
        };
    },

    loadAddressesFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({adds: data});
                if(data.length > 0)
                {
                    this.setState({selected: data[0].id});
                    for(var i=0;i<data.length;i++){
                        if(data[i].Is_Default) {
                            this.setState({selected: data[i].id});
                        }
                    }
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function() {
        this.loadAddressesFromServer();
    },

    componentWillMount: function() {
        this.pubsub_token = PubSub.subscribe('addressUpdated', function(topic) {
            this.loadAddressesFromServer();
        }.bind(this));
    },

    openNewForm: function(event) {
        PubSub.publish('editingAdd', emptyAdd);
    },

    handleUserSelectAdd: function(id) {
        this.setState({selected: id});
    },

    render: function() {
        var rows=[];
        var ReactObj=this;

        if(this.state.adds.length === 0)
        {
            return (
                <div>
                    <div className="row">
                        <div className="columns small-12">
                            <a className="button b2darkyellow tiny" onClick={this.openNewForm}><i className="fa fa-plus" aria-hidden="true"></i>Add New Address</a>
                        </div>
                    </div>
                    <div>No Addresses</div>
                </div>
            );
        }
        else
        {
            this.state.adds.forEach(function(add){
                rows.push(<AddressCard key={add.id} address={add} selected={ReactObj.state.selected==add.id} onUserSelectAdd={ReactObj.handleUserSelectAdd} />);
            });

            return (
                <ul className="no-bullet address_list">
                    {rows}
                    <a className="add_new_link button b2darkyellow tiny" onClick={this.openNewForm}><i className="fa fa-plus" aria-hidden="true"></i>&nbsp;Add New Address</a>
                </ul>
            );
        }

    }
});

ReactDOM.render(
    <AddressList url='/membercenter/ajaxgetaddresses'/>,
    document.getElementById('addressList')
);

ReactDOM.render(
    <AddressForm url='/membercenter/ajaxupdateaddress'/>,
    document.getElementById('AddressModal')
);

var StoreRow = React.createClass({
    render: function(){
        return (
            <tr className="storeTitle">
                <th colSpan="5" className="text-left">
                    Store: {this.props.store_name}
                </th>
            </tr>
        )
    }
});

var ShippingFeeSelect = React.createClass({

    onShippingChange: function (event) {
        this.props.onShippingChange(event.target.value);
    },

    render: function () {
        var optionRow = [];
        this.props.ShippingOptions.forEach(function (option) {
            optionRow.push(<option key={option.id_} value={option.id_}>{ option.option_ } : ${ Number(option.fee_)+Number(option.extra_fee_*this.props.extra_item) }</option>);
        }, this);

        var className = classnames({
            'shipping_method': true,
            'placeholder': !this.props.shippingFeeId
        });
        return (
            <select className={className} value={this.props.shippingFeeId} onChange={this.onShippingChange} required="true">
                <option value="">Please Select...</option>
                {optionRow}
            </select>
        )
    }
});

var ItemRow = React.createClass({
    onShippingChange: function (id) {
        this.props.onShippingChange(id, this.props.storeid, this.props.item.id_);
    },

    render: function(){
        var shipping_fee_select;
        if(this.props.item.store_item.ship_fee_type_=='free'){
            shipping_fee_select = 'Free shipping';
        }
        else {
            shipping_fee_select = <ShippingFeeSelect ShippingOptions={this.props.item.store_item.shipping_template.shipping_template_item} extra_item={this.props.item.qty_-1} shippingFeeId={this.props.shippingFeeId} onShippingChange={this.onShippingChange} />
        }
        return (
            <tr className="orderRow">
                <td>
                    <a href="#"><img src={this.props.item.store_item.image_url_}/></a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href={"/item/"+this.props.item.item_id_}>{this.props.item.store_item.title_}</a>
                </td>
                <td className="text-center">$<span className="itemPrice">{this.props.item.store_item.price_}</span></td>
                <td className="text-center"><span>{ this.props.item.qty_}</span></td>
                <td className="text-center">
                    {shipping_fee_select}
                </td>
                <td className="text-right"><span className="itemTotal">$ { Number(this.props.itemTotal).toFixed(2)}</span></td>
            </tr>
        )
    }
});

var StoreTotalRow = React.createClass({
    render: function () {
        return (
            <tr className="leaComment">
                <td colSpan="5" className="text-right">Subtotal: <span className="subTotalPrice">$ {Number(this.props.subtotal).toFixed(2)}</span></td>
            </tr>
        )
    }

});

var OrderTable = React.createClass({
    getInitialState: function () {
        return {
            shippingFee: emptyShippingFee //运费选择情况[itemid=>object(shippingTemplateItem)]
        }
    },

    onShippingChange: function (id, storeid, itemid) {
        var newshippingFee = ReactAddonsUpdate(this.state.shippingFee, {
            [storeid]:{[itemid]: {$set: id }}
        });
        this.setState({shippingFee: newshippingFee});
    },

    render: function () {
        var rows = [];
        var totalPrice = 0;
        var ReactObj = this;
        this.props.orders.forEach(function (order) {
            var subtotal = 0;

            rows.push(<StoreRow key={order.store.id_} store_name={order.store.store_name_} />);
            order.cart_items.forEach(function(item){
                var itemtotal = item.store_item.price_*item.qty_;

                if(item.store_item.ship_fee_type_ != "free")
                {
                    var current_shipping_option = item.store_item.shipping_template.shipping_template_item.find(function(option){return option.id_==ReactObj.state.shippingFee[order.store.id_][item.id_]})
                    if(current_shipping_option){
                        itemtotal = itemtotal + Number(current_shipping_option.fee_) + Number(current_shipping_option.extra_fee_)*(item.qty_-1);

                    }
                }

                subtotal = subtotal + itemtotal;
                rows.push(<ItemRow key={item.id_} storeid={order.store.id_} item={item} shippingFeeId={ReactObj.state.shippingFee[order.store.id_][item.id_]} itemTotal={itemtotal} onShippingChange={ReactObj.onShippingChange} />);
            });
            rows.push(<tr key={order.store.id_+'StoreMessage'}>
                            <td>
                                Leave Messages:<input className="comment" type="text" name={"message_"+order.store.id_} />
                            </td>
                            <td colSpan="4" className="text-right">
                                Dispatch date: within 2 days after purchase
                            </td>
                        </tr>);
            rows.push(<StoreTotalRow key={order.store.id_+'StoreTotal'} subtotal={subtotal} />);

            totalPrice = totalPrice+subtotal;
        });

        return (
            <table>
                <thead>
                <tr>
                    <th width="50%" className="text-center">Items</th>
                    <th width="10%" className="text-center">Unit Price</th>
                    <th width="10%" className="text-center">Quantity</th>
                    <th width="20%" className="text-center">Shipping Fee</th>
                    <th width="10%" className="text-center">Subtotal</th>
                </tr>
                </thead>
                <tbody>
                    {rows}
                    <tr>
                        <td colSpan="5">
                            <div className="text-right">Total: <span id="priceTotal" className="totalPrice">$ {Number(totalPrice).toFixed(2)}</span></div>
                            <div className="text-right SubmitRow"><a href="/cart" className="ReturnToCart"><i className="fa fa-reply" aria-hidden="true"></i> Return to Cart</a><button type="submit" className="SubmitButton button b2red">Place Order</button></div>
                            <input type="hidden" name="shippingFee" value={JSON.stringify(this.state.shippingFee)} />
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }

});

ReactDOM.render(
    <OrderTable orders={window.orders} />,
    document.getElementById('OrderTable')
);

var newAbide = new Foundation.Abide($('form'));

$('form').submit(function(e) {

    if(!$('input[name="address"]').length)
    {
        alert('Please Add Your Address First!');
        e.preventDefault();
    }

});