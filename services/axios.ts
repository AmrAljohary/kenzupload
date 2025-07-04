import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { create } from "apisauce";
import AsyncStorage from "@react-native-async-storage/async-storage";

// يمكن نقل هذا إلى ملف .env
export const BASE_URL = "https://kenzback.rascoda.com/api";

// الرؤوس الافتراضية للطلبات
export const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
};

// إنشاء مثيل لـ apisauce
export const api = create({
    baseURL: BASE_URL,
    headers: headers,
    timeout: 30000, // 30 ثانية
});

// إضافة اعتراض لإضافة التوكن إلى كل الطلبات
api.axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem("USER_TOKEN");
            if (token) {
                // تعديل الطريقة للتعامل مع الرؤوس بشكل آمن لـ TypeScript
                config.headers = config.headers || {};
                // استخدام as any لتجاوز تحقق النوع
                (config.headers as any)["Authorization"] = `Bearer ${token}`;
            }

            // التعامل مع FormData
            if (config.data instanceof FormData) {
                config.headers = config.headers || {};
                // استخدام as any لتجاوز تحقق النوع
                (config.headers as any)["Content-Type"] = "multipart/form-data";
            }
        } catch (error) {
            console.error("Error with authorization token:", error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// اعتراض الاستجابات للتعامل مع الأخطاء
api.axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const { status, data } = (error.response as any) || {};

        // التعامل مع انتهاء صلاحية التوكن (401)
        if (status === 401) {
            // هنا يمكن تسجيل الخروج من التطبيق
            console.error("Unauthorized access. Token may be expired.");
            // هنا يمكن استدعاء دالة تسجيل الخروج من المخزن
        }

        console.error("API Error:", status, data);
        return Promise.reject(error.response);
    }
);

export default api;
