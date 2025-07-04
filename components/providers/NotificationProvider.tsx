import React from "react";
import { Notification } from "../ui/Notification";
import { useNotificationStore } from "../../store/notification";

export const NotificationProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const {
        visible,
        type,
        mainText,
        subText,
        duration,
        autoClose,
        hideNotification,
    } = useNotificationStore();

    return (
        <>
            {children}
            <Notification
                visible={visible}
                type={type}
                mainText={mainText}
                subText={subText}
                duration={duration}
                autoClose={autoClose}
                onClose={hideNotification}
            />
        </>
    );
};
