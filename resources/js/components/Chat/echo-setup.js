import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Initialize Pusher with your credentials
window.Pusher = Pusher;

// Initialize Laravel Echo
const echo = new Echo({
  broadcaster: "pusher",
  key: process.env.MIX_PUSHER_APP_KEY || "44ca65ad05a98d3cd6b9", // Use your Pusher key
  cluster: process.env.MIX_PUSHER_APP_CLUSTER || "ap1", // Use your Pusher cluster
  forceTLS: true,
  authEndpoint: '/broadcasting/auth',
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        const userToken = localStorage.getItem("userToken");

        if (!userToken) {
          callback(true, {});
          return;
        }

        axios
          .post(
            "http://127.0.0.1:8000/api/broadcasting/auth",
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            }
          )
          .then((response) => {
            callback(false, response.data);
          })
          .catch((error) => {
            callback(true, error);
          });
      },
    };
  },
});

export default echo;