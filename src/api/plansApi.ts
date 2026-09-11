import { notifications } from "@mantine/notifications";
import { API_ENDPOINTS } from "../utils/constant";
import { api } from "./axios";

export interface PackageItem {
  _id: string;
  package_name: string;
  total_user_creation_limit: number;
  custom_user_creation_limit: number;
}

export interface UserPackageDetail {
  package_id: string;
  package_name: string;
  available_user_creation_limit: number;
  available_custom_usernames: number;
}

export const getAccountPackagesApi = async (): Promise<PackageItem[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.ACCOUNT_PACKAGES);
    const data = response.data;
    if (response.status === 200 && data.packages) {
      return data.packages;
    }
    return [];
  } catch (error: any) {
    notifications.show({
      title: "",
      message: error.response?.data?.message || "Failed to load packages.",
      color: "red",
    });
    return [];
  }
};

export const assignAccountPackageApi = async (
  packageId: string,
): Promise<boolean> => {
  try {
    const response = await api.post(API_ENDPOINTS.ACCOUNT_PACKAGES, {
      packageID: packageId,
    });
    const data = response.data;

    if (response.status === 200 || response.status === 201 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Plan subscribed successfully!",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to subscribe to plan.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    notifications.show({
      title: "",
      message: error.response?.data?.message || "Failed to subscribe to plan.",
      color: "red",
    });
    return false;
  }
};

export const updateAccountPackagesApi = async (
  packageIds: string[],
): Promise<boolean> => {
  try {
    const response = await api.put(API_ENDPOINTS.ACCOUNT_PACKAGES, {
      packageIDs: packageIds,
    });
    const data = response.data;

    if (response.status === 200 || response.status === 204 || data.success) {
      notifications.show({
        title: "",
        message: data.message || "Plan updated successfully!",
        color: "green",
      });
      return true;
    }

    notifications.show({
      title: "",
      message: data.message || "Failed to update plan.",
      color: "red",
    });
    return false;
  } catch (error: any) {
    notifications.show({
      title: "",
      message: error.response?.data?.message || "Failed to update plan.",
      color: "red",
    });
    return false;
  }
};

export const fetchFreshUserDetailsApi = async (): Promise<any | null> => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_DETAILS);
    if (response.status === 200 && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};
