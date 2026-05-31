import type { BusinessSettings } from "@/domain/types";
import { sellerBillName, sellerTaxId } from "@/lib/billDisplay";
import {
  formatSellerAddressLines,
  sellerPhoneNumber,
} from "@/lib/sellerAddressLine";

export type SellerLetterhead = {
  name: string;
  /** Address on printed bills (Settings line 1/2; optional district line). */
  addressLines: string[];
  tax: { label: "PAN" | "VAT"; number: string } | null;
  phone: string | null;
};

export { formatSellerAddressLines, sellerPhoneNumber } from "@/lib/sellerAddressLine";

export function sellerLetterheadFromBusiness(
  b: Pick<
    BusinessSettings,
    | "name"
    | "legalName"
    | "addressLine1"
    | "addressLine2"
    | "district"
    | "province"
    | "country"
    | "mobile"
    | "phone"
    | "vatRegistered"
    | "vatNumber"
    | "panNumber"
    | "showDistrictProvinceOnBill"
  >,
): SellerLetterhead {
  return {
    name: sellerBillName(b),
    addressLines: formatSellerAddressLines(
      {
        addressLine1: b.addressLine1,
        addressLine2: b.addressLine2,
        district: b.district,
        province: b.province,
        country: b.country,
      },
      { includeDistrictProvince: Boolean(b.showDistrictProvinceOnBill) },
    ),
    tax: sellerTaxId(b),
    phone: sellerPhoneNumber({ mobile: b.mobile, phone: b.phone }),
  };
}
