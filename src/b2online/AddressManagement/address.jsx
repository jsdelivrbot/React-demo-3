require('./address.scss');
require('modules/membercenter.js');
require('component/address.js');
require('motion-ui');

var React = require('react');
var ReactDOM = require('react-dom');
var ReactAddonsUpdate = require('react-addons-update');
var PubSub = require('pubsub-js');
var AddressForm = require('component/addressForm/addressForm.jsx');

$('#addressForm').on('keyup keypress', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        return false;
    }
});

var emptyAdd = {
    id: '',
    Receiver: '',
    Address: '',
    Phone: '',
    Memo: '',
    Is_Default: true
};

var AddressListRow = React.createClass({

    openEditForm: function() {
        PubSub.publish('editingAdd', this.props.add);
    },

    deleteAddress: function() {
        this.props.onUserDelAdd(this.props.add.id);
    },

    render: function() {
        return (
            <tr>
                <td className="vMiddlepa addrInfo">
                    <div className="vMiddleCh">
                        {this.props.add.Receiver}
                    </div>
                </td>
                <td className="vMiddlepa addrInfo">
                    <div className="vMiddleCh">{this.props.add.Phone}</div>
                </td>
                <td className="vMiddlepa addrInfo">
                    <div className="vMiddleCh">{this.props.add.Address}</div>
                </td>
                <td className="vMiddlepa addrInfo">
                    <div className="vMiddleCh">{this.props.add.Memo} </div>
                </td>
                <td className="vMiddlepa addrInfo">
                    <div className="vMiddleCh"> {this.props.add.Is_Default?"Default":""}</div>
                </td>
                <td className="vMiddlepa addrInfo vMiddleCh-button">
                    <div className="vMiddleCh btn-wrapper">
                        <a className="button tiny warning" onClick={this.openEditForm}>Edit</a>
                        <a className="button tiny b2red" onClick={this.deleteAddress}>Delete</a>
                    </div>
                </td>
            </tr>
        );
    }
});

var AddressList = React.createClass({
    getInitialState: function() {
        return {
            adds: []
        };
    },

    loadAddressesFromServer: function() {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            cache: false,
            success: function(data) {
                this.setState({adds: data});
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
            //if(addressJson.newFlag == 1) {
            //    var newAdds = ReactAddonsUpdate(this.state.adds, {$push: [addressJson.address]});
            //    this.setState({adds: newAdds});
            //}
            //else
            //{
            //    var newAdds = ReactAddonsUpdate(this.state.adds, {$splice: [[this.state.adds.findIndex(function(element){ return element.id==addressJson.address.id }), 1, addressJson.address]]});
            //    this.setState({adds: newAdds});
            //}
        }.bind(this));
    },

    componentWillUnmount: function() {
        PubSub.unsubscribe(this.pubsub_token);
    },

    openNewForm: function(event) {
        PubSub.publish('editingAdd', emptyAdd);
    },

    handleAddressDelete: function(address_id){
        $.ajax({
            url: "/membercenter/ajaxdeladdress",
            method: 'POST',
            data: {id: address_id},
            success: function(data) {
                //var newAdds = ReactAddonsUpdate(this.state.adds, {$splice: [[this.state.adds.findIndex(function(element){ return element.id==address_id }), 1]]});
                this.loadAddressesFromServer();
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function() {
        var rows=[];
        var reactObj = this;
        if(this.state.adds.length === 0)
        {
            return (
            <div>
                <div className="row">
                    <div className="columns small-12">
                        <a className="button b2darkyellow AddNA" onClick={this.openNewForm}>Add New Address</a>
                    </div>
                </div>
                <table class="hover addrTitle">
                    <thead>
                        <tr>
                            <th>Receiver</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Operate</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan='4'>
                                No Records
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            );
        }
        else
        {
            this.state.adds.forEach(function(add){
                rows.push(<AddressListRow key={add.id} add={add} onUserDelAdd={reactObj.handleAddressDelete} />);
            });

            return (
                <div>
                    <div className="row">
                        <div className="columns small-12">
                            <a className="button b2darkyellow AddNA" onClick={this.openNewForm}>Add New Address</a>
                        </div>
                    </div>
                    <div>
                        <table class="hover addrTitle">
                            <thead>
                                <tr>
                                    <th>Receiver</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Memo</th>
                                    <th></th>
                                    <th>Operate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows}
                            </tbody>

                        </table>
                    </div>
                </div>
            );
        }
    }
});



ReactDOM.render(
    <AddressList url='/membercenter/ajaxgetaddresses'/>,
    document.getElementById('addressListTable')
);

ReactDOM.render(
    <AddressForm url='/membercenter/ajaxupdateaddress'/>,
    document.getElementById('AddressModal')
);