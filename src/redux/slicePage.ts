import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { APP_NAME } from "../utils/constants";
import { INavItem } from "../types";

export interface PageState {
  navItems: INavItem[];
  title: string;
}

const initialState: PageState = {
  navItems: [],
  title: APP_NAME,
};

export const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {
    updatePageState: (state, action: PayloadAction<PageState>) => {
      state.navItems = action.payload.navItems;
      state.title = action.payload.title
        ? `${APP_NAME} - ${action.payload.title}`.toLowerCase()
        : APP_NAME;
    },
  },
});

export const { updatePageState } = pageSlice.actions;

export default pageSlice.reducer;
