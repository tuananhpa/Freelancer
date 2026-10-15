/** @typedef {{slug:string,name:string,image:string,group:string,form:string,category:string,featured:boolean,isNew:boolean}} Product */
export const business = {
  name:'Vĩnh Thuận Phát', phone:'0903 007 095', tel:'0903007095',
  phones:['(028) 6271 4746','0903 745 746','0903 007 095'],
  address:'1/100 Lữ Gia, Phường 15, Quận 11, TP.HCM',
  email:'phucnguyen.quangvan@gmail.com', distributor:'Phúc Nguyên',
};
export const groups = [
  {slug:'thao-duoc',name:'Thảo dược',description:'Hương thơm từ thảo mộc',panel:0},
  {slug:'tram-huong',name:'Trầm hương',description:'Trầm ấm, sâu lắng',panel:1},
  {slug:'dan-huong',name:'Đàn hương',description:'Dịu nhẹ và thân thuộc',panel:2},
  {slug:'khac',name:'Sản phẩm thờ cúng',description:'Cho không gian thờ tự',panel:3},
];
export const forms = [{slug:'cay',name:'Nhang cây'},{slug:'khoanh',name:'Nhang khoanh'},{slug:'vien',name:'Nhang viên'}];
export const otherCategories = [
  {slug:'nhang-que',name:'Nhang Quế'}, {slug:'san-pham-tho-cung',name:'Sản phẩm thờ cúng'},
  {slug:'dau-cat-tuong',name:'Dầu Cát Tường'}, {slug:'den-xong-huong',name:'Đèn xông hương'},
];
const product = (slug,name,image,group,form,category,isNew=false) => ({slug,name,image:`/images/${image}.jpg`,group,form,category,featured:!isNew,isNew});
/** @type {Product[]} Source: original homepage, 2026-10-15. Static snapshot, not the complete store inventory. */
export const products = [
  product('nhang-cay-dan-huong-20cm','Nhang cây Đàn Hương 20cm','dan-huong-20','dan-huong','cay','nhang-cay-dan-huong'),
  product('nhang-cay-thao-duoc-20cm','Nhang cây Thảo Dược 20cm','thao-duoc-20','thao-duoc','cay','nhang-cay-thao-duoc'),
  product('nhang-cay-tram-huong-cao-cap-20cm','Nhang cây Trầm Hương cao cấp 20cm','tram-huong-20','tram-huong','cay','nhang-cay-tram-huong'),
  product('nhang-cay-dan-huong-cao-cap-30cm-3','Nhang cây Đàn Hương cao cấp 30cm','dan-huong-30','dan-huong','cay','nhang-cay-dan-huong'),
  product('nhang-khoanh-thao-duoc-ong-tho-24h-2','Nhang khoanh Thảo Dược Hoa Sen 24h','khoanh-thao-duoc-sen','thao-duoc','khoanh','nhang-khoanh-thao-duoc'),
  product('nhang-khoanh-thao-duoc-en-24h-2','Nhang khoanh Thảo Dược Én 24h','khoanh-thao-duoc-en','thao-duoc','khoanh','nhang-khoanh-thao-duoc'),
  product('nhang-khoanh-dan-huong-cao-cap-24h-2','Nhang khoanh Đàn Hương cao cấp 24h','khoanh-dan-huong','dan-huong','khoanh','nhang-khoanh-dan-huong'),
  product('nhang-cay-cao-cap-dan-huong','Nhang viên Đàn Hương cao cấp','vien-dan-huong','dan-huong','vien','nhang-vien-dan-huong'),
  product('nen-gel-paraffin-ngu-sac','Nến gel Paraffin Ngũ sắc','nen-ngu-sac','khac','nen','san-pham-tho-cung',true),
  product('nen-tealight-dau-co-vanda-tinh-khiet-100-vien-hop-3-mau-trang-do-vang','Nến Tealight dầu Cọ Vanda 100 viên/hộp','nen-tealight-100','khac','nen','san-pham-tho-cung',true),
  product('nen-tealight-dau-co-tinh-khiet-18-vien-hop-3-mau-trang-do-vang','Nến Tealight dầu Cọ 18 viên/hộp','nen-tealight-18','khac','nen','san-pham-tho-cung',true),
  product('nen-gel-100-paraffin-jelly-hop-nen-nho-2-ly-thoi-gian-chay-03-ngay-2-mau-do-vang','Nến gel Paraffin JELLY — hộp nhỏ','nen-gel-nho','khac','nen','san-pham-tho-cung',true),
  product('nen-gel-100-paraffin-jelly-hop-nen-trung-2-ly-thoi-gian-chay-06-ngay-3-mau-trang-do-vang','Nến gel Paraffin JELLY — hộp trung','nen-gel-trung','khac','nen','san-pham-tho-cung',true),
  product('nen-gel-100-paraffin-jelly-hop-1-ly-thoi-gian-chay-10-ngay-3-mau-trang-do-vang','Nến gel Paraffin JELLY — hộp đại','nen-gel-dai','khac','nen','san-pham-tho-cung',true),
  product('dau-luu-ly-ca-chep-thai-binh','Dầu lưu ly Cá Chép, Thái Bình','dau-luu-ly','khac','dau','dau-cat-tuong',true),
  product('den-bo-mani-tai-bao-tara-cu','Đèn Bơ Mani Tài bảo','den-bo-mani','khac','den','san-pham-tho-cung',true),
];
export function categoryName(slug) {
  const group = groups.find(g=>g.slug===slug);
  if (group) return group.name;
  const other = otherCategories.find(c=>c.slug===slug);
  if (other) return other.name;
  for (const g of groups.slice(0,3)) for (const f of forms) if (slug===`nhang-${f.slug}-${g.slug}`) return `${f.name} ${g.name}`;
  return 'Tất cả sản phẩm';
}
