"use client";

import { useState, useCallback, memo } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ImageUploader, ExtractedData } from "./ImageUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PencilIcon } from "lucide-react";

export interface UserData {
  name: string;
  age: number | "";
  weight: number | "";
  height: number | "";
  skeletalMuscleMass: number | "";
  bodyFatPercentage: number | "";
  bodyFatMass: number | "";
  smi: number | "";
  bmr: number | "";
  visceralFatLevel: number | "";
  inbodyScore: number | "";
}

// A reusable component for the form fields
const UserProfileForm = memo(({
  readOnly,
  userData,
  handleChange,
}: {
  readOnly: boolean;
  userData: UserData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-6 py-4">
    <fieldset className="space-y-4">
      <legend className="text-base font-medium text-foreground">基本情報</legend>
      <div className="space-y-2">
        <Label htmlFor="name">名前</Label>
        <Input
          id="name"
          name="name"
          value={userData.name}
          onChange={handleChange}
          placeholder="山田 太郎"
          required
          readOnly={readOnly}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">年齢</Label>
          <Input
            id="age"
            name="age"
            type="number"
            value={userData.age}
            onChange={handleChange}
            placeholder="30"
            required
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">体重 (kg)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            value={userData.weight}
            onChange={handleChange}
            placeholder="70"
            required
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">身長 (cm)</Label>
          <Input
            id="height"
            name="height"
            type="number"
            value={userData.height}
            onChange={handleChange}
            placeholder="175"
            required
            readOnly={readOnly}
          />
        </div>
      </div>
    </fieldset>

    <fieldset className="space-y-4">
      <legend className="text-base font-medium text-foreground">
        身体データ（任意）
      </legend>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="skeletalMuscleMass">筋肉量 (kg)</Label>
          <Input
            id="skeletalMuscleMass"
            name="skeletalMuscleMass"
            type="number"
            value={userData.skeletalMuscleMass}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bodyFatPercentage">体脂肪率 (%)</Label>
          <Input
            id="bodyFatPercentage"
            name="bodyFatPercentage"
            type="number"
            value={userData.bodyFatPercentage}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bodyFatMass">体脂肪量 (kg)</Label>
          <Input
            id="bodyFatMass"
            name="bodyFatMass"
            type="number"
            value={userData.bodyFatMass}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smi">SMI (骨格筋指数)</Label>
          <Input
            id="smi"
            name="smi"
            type="number"
            value={userData.smi}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bmr">基礎代謝量 (kcal)</Label>
          <Input
            id="bmr"
            name="bmr"
            type="number"
            value={userData.bmr}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visceralFatLevel">内臓脂肪レベル</Label>
          <Input
            id="visceralFatLevel"
            name="visceralFatLevel"
            type="number"
            value={userData.visceralFatLevel}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inbodyScore">InBodyスコア</Label>
          <Input
            id="inbodyScore"
            name="inbodyScore"
            type="number"
            value={userData.inbodyScore}
            onChange={handleChange}
            readOnly={readOnly}
          />
        </div>
      </div>
    </fieldset>
  </div>
));

export function UserDataForm({ onNext }: { onNext: (data: UserData) => void }) {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    age: "",
    weight: "",
    height: "",
    skeletalMuscleMass: "",
    bodyFatPercentage: "",
    bodyFatMass: "",
    smi: "",
    bmr: "",
    visceralFatLevel: "",
    inbodyScore: "",
  });
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : name === "name" ? value : Number(value),
    }));
  }, []);

  const handleUploadComplete = (extractedData: ExtractedData) => {
    setUserData({
      name: extractedData.name || "",
      age: extractedData.age || "",
      weight: extractedData.weight || "",
      height: extractedData.height || "",
      skeletalMuscleMass: extractedData.skeletalMuscleMass || "",
      bodyFatPercentage: extractedData.bodyFatPercentage || "",
      bodyFatMass: extractedData.bodyFatMass || "",
      smi: extractedData.smi || "",
      bmr: extractedData.bmr || "",
      visceralFatLevel: extractedData.visceralFatLevel || "",
      inbodyScore: extractedData.inbodyScore || "",
    });
    setHasUploaded(true);
    // Start in view-only mode
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(userData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">InBodyシートをアップロード</TabsTrigger>
          <TabsTrigger value="manual">手動で入力</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          {!hasUploaded ? (
            <div className="space-y-4 py-4">
              <p className="text-center text-sm text-muted-foreground">
                InBodyシートをアップロードすると、データが自動で入力されます。
              </p>
              <ImageUploader onUploadComplete={handleUploadComplete} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pt-4">
                <h3 className="text-lg font-medium">読み取り結果の確認</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  {isEditing ? "完了" : "編集"}
                </Button>
              </div>
              <UserProfileForm
                readOnly={!isEditing}
                userData={userData}
                handleChange={handleChange}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="manual">
          <UserProfileForm
            readOnly={false}
            userData={userData}
            handleChange={handleChange}
          />
        </TabsContent>
      </Tabs>
      <Button
        type="submit"
        className="w-full mt-4"
        disabled={
          !userData.name || !userData.age || !userData.weight || !userData.height
        }
      >
        この内容で続ける
      </Button>
    </form>
  );
} 