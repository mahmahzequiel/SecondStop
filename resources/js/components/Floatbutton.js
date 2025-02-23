import React from "react";
import { FloatButton } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const FloatingButton = () => {
  return (
    <FloatButton
      icon={<MessageOutlined />}
      type="primary"
      style={{ right: 24 }}
      onClick={() => alert("Button Clicked!")}
    />
  );
};

export default FloatingButton;
