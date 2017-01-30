require('./cart.scss');

var React = require('react');
var ReactDOM = require('react-dom');
var ReactAddonsUpdate = require('react-addons-update');

/**
 * Created by jianghaibo on 23/04/16.
 */
var CartStoreRow = React.createClass({

    toggleChecked: function(event) {
        this.props.onUserToggleChecked(this.props.store.id_);
    },

    render: function() {
        return (
            <tr>
                <th colSpan="6" className="text-left">
                    <input type="checkbox" checked={this.props.checked} onChange={this.toggleChecked} />
                    &nbsp;Store: <a href={'/store/'+this.props.store.store_name_}>{this.props.store.store_name_}</a>
                </th>
            </tr>
        );
    }
});

var CartItemRow = React.createClass({

    handleQtyChange: function(event) {
        var qty=event.target.value;
        if(event.target.value < 0) {
            qty = 0;
        }
        else if(event.target.value > this.props.CartItem.store_item.qty_) {
            qty = this.props.CartItem.store_item.qty_;
        }

        if(qty != this.props.CartItem.qty_)
        {
            this.props.onUserInputQty(this.props.CartItem, qty);
        }
    },

    plusNumber: function() {
        if(this.props.CartItem.qty_ < this.props.CartItem.store_item.qty_) {
            this.props.onUserInputQty(this.props.CartItem, Number(this.props.CartItem.qty_) + 1);
        }
    },

    minusNumber: function() {
        if(this.props.CartItem.qty_ > 1) {
            this.props.onUserInputQty(this.props.CartItem, Number(this.props.CartItem.qty_) - 1);
        }
    },

    handleItemDel: function(event) {
        this.props.onUserInputDel(this.props.CartItem);
        //更新DB
        $.ajax({
            url: '/cart/'+this.props.CartItem.id_,
            type: 'POST',
            data: {'_method':'DELETE'},
            success: function(data) {

            }.bind(this),
            error: function(xhr, status, err) {
                console.error('/cart/'+this.props.CartItem.id_, status, err.toString());
            }.bind(this)
        });
    },

    toggleChecked: function(event) {
        this.props.onUserToggleChecked(this.props.CartItem.id_, this.props.CartItem.store_id_);
    },

    render: function() {
        return (
            <tr className="tr-items">
                <td>
                    <input type="checkbox" name={ "cartItemId["+this.props.CartItem.store_id_+"][]" } value={ this.props.CartItem.id_ } checked={ this.props.CartItem.checked } onChange={this.toggleChecked} />
                    &nbsp;<a href={'/item/'+this.props.CartItem.item_id_ }><img src={this.props.CartItem.store_item.image_url_} /></a>
                </td>
                <td>
                    <a href={'/item/'+this.props.CartItem.item_id_ }>{this.props.CartItem.item_name_}</a>
                </td>
                <td>{this.props.CartItem.price_}</td>
                <td id="quantity">
                    <input type='button' value='-' className='qtyminus' onClick={this.minusNumber} />
                    <input type='text' className='qty' value={this.props.CartItem.qty_} onChange={this.handleQtyChange} />
                    <input type='button' value='+' className='qtyplus' onClick={this.plusNumber} />
                </td>
                <td className="subtotal"><strong>{Number(this.props.CartItem.price_*this.props.CartItem.qty_).toFixed(2)}</strong></td>
                <td><a class="" href="javascript:;" className="delete button b2red small margin-top" onClick={this.handleItemDel}>Delete</a></td>
            </tr>
        );
    }
});

var CheckoutBar = React.createClass({
    toggleAllChecked : function() {
        this.props.onUserToggleChecked();
    },

    handleDelAllSelected: function(event) {
        this.props.onUserDelAllSelected();
    },

    render: function(){
        return (
            <tr className="checkout-bar">
                <td>
                    <input type="checkbox" id="selectAll_top" className="checkAll" checked={this.props.checked} onChange={this.toggleAllChecked} /> Select All
                </td>
                <td>
                    Selected <span id="selectedTotal" className="total">{this.props.selected}</span> Item(s)&nbsp;&nbsp;<a href="javascript:;" id="deleteAll" onClick={this.handleDelAllSelected}>Delete All Selected</a>
                </td>
                <td colSpan="3">
                    Total: <strong className="total">$ {this.props.totalPrice}</strong> (excl. shipping cost)
                </td>
                <td>
                    <button className="button float-right CheckoutBtn" type="submit">
                        Checkout
                    </button>
                </td>
            </tr>
        );
    },
});

var CartTable = React.createClass({
    getInitialState: function() {
        return {
            items: []
        };
    },

    componentDidMount: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                for(var store_id in data){
                    data[store_id].map(function(item) {
                        item.checked = true;
                    });
                };
                this.setState({items: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    handleUserInputQty: function(cartItem, qty) {
        for(var key in this.state.items) {
            for(var i=0;i<this.state.items[key].length;i++)
            {
                if (this.state.items[key][i].id_ == cartItem.id_)
                {
                    var newItems = ReactAddonsUpdate(this.state.items, {
                        [key]: {[i]: {qty_: {$set: qty}}}
                    });
                    this.setState({items: newItems});
                    break;
                }
            }
        }

        //更新DB
        $.ajax({
            url: '/cart/'+cartItem.id_,
            type: 'POST',
            data: {'_method':'PUT', 'qty':qty},
            success: function(data) {

            }.bind(this),
            error: function(xhr, status, err) {
                console.error('/cart/'+cartItem.id_, status, err.toString());
            }.bind(this)
        });
    },

    handleUserInputDel: function(cartItem) {
        var newItems=[];

        for(var key in this.state.items) {
            for(var i=0;i<this.state.items[key].length;i++)
            {
                if (this.state.items[key][i].id_ == cartItem.id_)
                {
                    var newItems = ReactAddonsUpdate(this.state.items, {
                        [key]: {$splice: [[i, 1]]}
                    });
                    //如果本店铺空了
                    if(newItems[key].length == 0)
                    {
                        delete newItems[key];
                    }
                    this.setState({items: newItems});
                    break;
                }
            }
        };
    },

    handleUserCheckedStore: function(store_id) {
        var new_checked = !this.calcStoreChecked(store_id);
        var newItems = this.state.items;
        //该店铺下所有item toggle checked
        for(var i=0;i<newItems[store_id].length;i++)
        {
            if(newItems[store_id][i].checked != new_checked)
            {
                var newItems = ReactAddonsUpdate(newItems, {
                    [store_id]: {[i]: {checked: {$set: new_checked }}}
                });
                this.setState({items: newItems});
            }
        }
    },

    handleUserCheckedItem: function(item_id, store_id) {
        for(var i=0;i<this.state.items[store_id].length;i++)
        {
            if(this.state.items[store_id][i].id_ == item_id)
            {
                var newItems = ReactAddonsUpdate(this.state.items, {
                    [store_id]: {[i]: {checked: {$apply: function(checked) {return !checked;} }}}
                });
                this.setState({items: newItems});
            }
        }
    },

    calcStoreChecked: function(store_id)
    {
        return this.state.items[store_id].every(function(item){
            return item.checked;
        });
    },

    calcAllChecked: function()
    {
        var temp_checked = true;
        for(var key in this.state.items) {
            temp_checked = temp_checked && this.calcStoreChecked(key);
        };

        return temp_checked;
    },

    toggleAllChecked: function() {
        var new_checked = !this.calcAllChecked();
        var newItems = this.state.items;

        for(var key in newItems) {
            //所有item toggle checked
            for(var i=0;i<newItems[key].length;i++)
            {
                if(newItems[key][i].checked != new_checked)
                {
                    var newItems = ReactAddonsUpdate(newItems, {
                        [key]: {[i]: {checked: {$set: new_checked }}}
                    });

                    this.setState({items: newItems});
                }
            }
        };
    },

    calcAllPrice : function() {
        var allPrice = 0;
        for(var key in this.state.items) {
            for(var i=0;i<this.state.items[key].length;i++)
            {
                if(this.state.items[key][i].checked)
                {
                    allPrice = allPrice + (this.state.items[key][i].price_ * this.state.items[key][i].qty_);
                }
            }
        };

        return allPrice.toFixed(2);
    },

    countSelected: function() {
        var count = 0;
        for(var key in this.state.items) {
            for(var i=0;i<this.state.items[key].length;i++)
            {
                if(this.state.items[key][i].checked)
                {
                    count ++;
                }
            }
        };

        return count;
    },

    delAllSelected: function() {
        var idArray = [];
        var newItems = this.state.items;
        for(var key in newItems) {
            for(var i=0;i<newItems[key].length;i++)
            {
                if(newItems[i].checked)
                {
                    idArray.push(newItems[key][i].id_);

                    var newItems = ReactAddonsUpdate(newItems, {
                        [key]: {$splice: [[i, 1]]}
                    });
                    //如果本店铺空了
                    if(newItems[key].length == 0)
                    {
                        delete newItems[key];
                    }
                    this.setState({items: newItems});
                }
            }
        };

        //更新DB
        $.ajax({
            url: '/cart/'+idArray.join(),
            type: 'POST',
            data: {'_method':'DELETE'},
            success: function(data) {

            }.bind(this),
            error: function(xhr, status, err) {
                console.error('/cart/'+idArray.join(), status, err.toString());
            }.bind(this)
        });
    },

    render: function() {
        var rows = [];
        var reactObj = this;
        if(Object.keys(this.state.items).length === 0)
        {
            return (
                <div id="emptyCart" className="row">
                    <div className="small-4 columns text-center">
                        <img className="image" src="/img/cart-img/emptyCart.png" />
                    </div>
                    <div className="small-8 columns">
                        <h4>Your shopping cart is empty.</h4>
                        <ul>
                            <li>Go to your <a href="/membercenter/favouritestore">favourite stores</a> and select some items or</li>
                            <li>Add all wonderful products that you've been dreaming of!</li>
                        </ul>
                    </div>
                </div>
            );
        }

        for(var key in this.state.items)
        {
            if(this.state.items[key][0].store_item)
            {
                rows.push(<CartStoreRow store={this.state.items[key][0].store_item.store} key={this.state.items[key][0].store_id_} checked={this.calcStoreChecked(key)} onUserToggleChecked={reactObj.handleUserCheckedStore} />);
            }
            this.state.items[key].forEach(function(item) {
                rows.push(<CartItemRow CartItem={item} key={item.id_} onUserInputQty={reactObj.handleUserInputQty} onUserInputDel={reactObj.handleUserInputDel} onUserToggleChecked={reactObj.handleUserCheckedItem} />);
            });
        }

        var all_checked = this.calcAllChecked();
        var countSelected = this.countSelected();
        var calcAllPrice = this.calcAllPrice();

        return (
            <div className="row">
                <table>
                    <thead>
                    <tr>
                        <th width="150"><input type="checkbox" id="selectAll_top" className="checkAll" checked={all_checked} onChange={reactObj.toggleAllChecked} />&nbsp;Select All</th>
                        <th width="500">Items</th>
                        <th width="100">Unit Price</th>
                        <th width="100">Quantity</th>
                        <th width="100">Subtotal</th>
                        <th width="100">Operate</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows}
                    <CheckoutBar checked={all_checked} onUserToggleChecked={reactObj.toggleAllChecked} onUserDelAllSelected = {reactObj.delAllSelected} selected={countSelected}  totalPrice={calcAllPrice} />
                    </tbody>
                </table>
            </div>
        );
    }
});


ReactDOM.render(
    <CartTable url='/cart/ajaxgetitems'/>,
    document.getElementById('CartTable')
);

