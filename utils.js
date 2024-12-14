export function toNotification(content, referenceId, title, imageUrl, entityType) {
 return {
   Id: Date.now(), // Generate unique ID using timestamp
   AccountId: referenceId, // Default AccountId or can be passed as parameter
   ReferenceId: referenceId,
   ImageUrl: imageUrl || null,
   Title: title,
   Content: content,
   Data:"",
   EntityType: 6,
   Type: 200,
   IsSave: true, 
   IsRead: false,
   CreatedBy: 15, // Can be passed as parameter
   CreatedDate: new Date().toISOString(),
   UpdatedBy: 15, // Can be passed as parameter
   UpdatedDate: new Date().toISOString()
 };
}