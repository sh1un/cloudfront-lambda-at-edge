import cf from 'cloudfront';
let kvs_handle = null;
const kvs_id = '<your keyvaluedataset>';

function init_kvs_handle() {
    try {
        kvs_handle = cf.kvs(kvs_id);
    } catch (err) {
        console.log(`Kvs handle load failed for ${kvs_id} : ${err}`);
    }
}

// Load a handle to associated KVS
// KVS loading will fail if no association exists with the function:
init_kvs_handle();

async function handler(event) {
    if (kvs_handle) {
        let src_uri = event.request.uri;
        let is_mobile = "false";
        try {
            is_mobile = event.request.headers['cloudfront-is-mobile-viewer'].value;

        } catch (err) {
            console.log('header not found.');
        }

        try {
            const config = await kvs_handle.get(src_uri, {
                'format': 'json'
            });
            console.log(config);
            let response = null;

            if (config["match_type"] == "device") {
                console.log('enter block device');
                var items = config["items"];
                items.forEach(function (item) {
                    console.log(item);
                    if (item["is_mobile"] == is_mobile) {
                        response = {
                            statusCode: item["status_code"],
                            headers: {
                                "location": {
                                    value: item["dest_uri"]
                                }
                            }
                        };
                    }
                });
            } else if (config["match_type"] == "none") {
                console.log('enter block none');
                response = {
                    statusCode: config["status_code"],
                    headers: {
                        "location": {
                            value: config["dest_uri"]
                        }
                    }
                };
            } else {
                //at the moment no action to take.
                console.log('enter empty block');
            }

            if (response) {
                return response;
            } else {
                return event.request;
            }

        } catch (err) {
            console.log(`Kvs key lookup failed: ${err}`);
        }
    }

    return event.request;

}