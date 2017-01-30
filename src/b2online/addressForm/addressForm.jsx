require('./addressForm.scss');

var React = require('react');
var PubSub = require('pubsub-js');

var emptyAdd = {
    id: '',
    Receiver: '',
    Address: '',
    Phone: '',
    Memo: '',
    Is_Default: true
};

var AddressForm = React.createClass({
    getInitialState: function() {
        return emptyAdd;
    },

    handleFormSubmit: function(event) {
        event.preventDefault();

        $.ajax({
            url: this.props.url,
            method: 'POST',
            data: this.state,
            success: function(data) {
                //通知
                PubSub.publish('addressUpdated');
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        $('#AddressModal').foundation('close');
    },

    handleFormClose: function(event) {
        $('#AddressModal').foundation('close');
    },

    componentWillMount: function() {
        // when React renders me, I subscribe to the topic 'products'
        // .subscribe returns a unique token necessary to unsubscribe
        this.pubsub_token = PubSub.subscribe('editingAdd', function(topic, address) {
            // update my selection when there is a message
            this.setState({
                id: address.id,
                Receiver: address.Receiver,
                Address: address.Address,
                Phone: address.Phone,
                Memo: address.Memo,
                Is_Default: address.Is_Default
            });
            $('#AddressModal').foundation('open');
        }.bind(this));

        this.pubsub_token2 = PubSub.subscribe('place_changed', function(topic) {
            this.setState({Address:$('#address').val()});
        }.bind(this));
    },

    componentWillUnmount: function() {
        // React removed me from the DOM, I have to unsubscribe from the pubsub using my token
        PubSub.unsubscribe(this.pubsub_token);
        PubSub.unsubscribe(this.pubsub_token2);
    },

    handleInput: function(event) {
        var tempObj = {};
        tempObj[event.target.name] = event.target.value;
        this.setState(tempObj);
    },

    handleCheckboxInput: function(event) {
        this.setState({Is_Default: !this.state.Is_Default});
    },

    render: function() {
        return (
            <form onSubmit={this.handleFormSubmit}>
                <div id="AddNewAddress">
                    <div className="row">
                        <div className="small-4 columns">
                            <label className="info-title text-right" id="label_receiverName" htmlFor="receiverName"><span>*</span> Receiver’s Name:</label>
                        </div>
                        <div className="small-8 columns">
                            <input type="text" id="receiver" name="Receiver" value={this.state.Receiver} placeholder="Name" onChange={this.handleInput} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="small-4 columns">
                            <label className="info-title text-right" id="label_address" htmlFor="address"><span>*</span> Address:</label>
                        </div>
                        <div className="small-8 columns">
                            <input type="text" id="address" name="Address" value={this.state.Address} placeholder="Address" onChange={this.handleInput} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="small-4 columns">
                            <label className="info-title text-right" id="label_priPhone" htmlFor="priPhone"><span>*</span> Phone:</label>
                        </div>
                        <div className="small-8 columns">
                            <input type="text" id="priPhone" name="Phone" value={this.state.Phone} placeholder="Phone Number" onChange={this.handleInput} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="small-4 columns">
                            <label className="info-title text-right" id="label_secPhone" htmlFor="Memo">Memo:</label>
                        </div>
                        <div className="small-8 columns">
                            <input type="text" id="Memo" name="Memo" value={this.state.Memo} placeholder="Memo" onChange={this.handleInput} />
                        </div>
                    </div>
                </div>

                <div id="submitWrap" className="row">
                    <div className="small-12 columns text-center">
                        <label htmlFor="terChe">
                            <input type="checkbox" id="terChe" name="Is_Default" value="1" checked={this.state.Is_Default} onChange={this.handleCheckboxInput} />
                            Set as the default delivery address
                        </label>
                    </div>

                    <div className="small-12 columns">
                        <input type="submit" id="submit" className="button b2red float-center" value='SAVE' />
                    </div>
                </div>

                <button className="close-button" onClick={this.handleFormClose} aria-label="Close modal" type="button">
                    <span aria-hidden="true">&times;</span>
                </button>
            </form>
        );
    }
});

module.exports= AddressForm;
