import React, { FormEvent, useState } from 'react';
import Header from '../components/Header';
import { useAddress, useContract } from '@thirdweb-dev/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
type Props = {};

function addItem({}: Props) {
  const address = useAddress();
  const router = useRouter();
  const [preview, setPreview] = useState<string>();
  const [image, setImage] = useState<File>();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    'nft-collection'
  );
  const mintNft = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contract || !address) return;

    if (!image) {
      return alert('Please select an image');
    }

    const target = e.target as typeof e.target & {
      name: { value: string };
      description: { value: string };
    };

    const metadata = {
      name: target.name.value,
      description: target.description.value,
      image: image, // image url or file
    };

    try {
      const tx = await contract.mintTo(address, metadata);
      const receipt = tx.receipt; // transaction receipt
      const tokenId = tx.id; // token id
      const nft = await tx.data(); // optional, fetches the nft data minted

      console.log(receipt, tokenId, nft);
      router.push('/');
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-10 border">
        <h1 className="text-4xl font-bold">Add an Item to Marketplace</h1>
        <h2 className="text-xl font-semibold py-4">Item details</h2>
        <p className="pb-5">
          By adding an item to the marketplace, you're essentially Minting and
          NFT of the item into your wallet which we can then list for sale!
        </p>

        <div className="flex flex-col justify-center items-center md:flex-row md:space-x-5 pt-5">
          <Image
            alt="uploadImage"
            src={preview || 'https://links.papareact.com/ucj'}
            width={320}
            height={320}
            className="border h-80 w-80 object-contain"
          />
          <form
            onSubmit={mintNft}
            className="flex flex-col flex-1 p-2 space-y-2"
          >
            <label className="font-light">Name of Item</label>
            <input
              type="text"
              className="formField"
              placeholder="Name of item..."
              name="name"
              id="name"
            />
            <label className="font-light">Description</label>
            <input
              type="text"
              className="formField"
              placeholder="Enter Description..."
              name="description"
              id="description"
            />
            <label className="font-light">Image of the Item</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setPreview(URL.createObjectURL(e.target.files[0]));
                  setImage(e.target.files[0]);
                }
              }}
            />
            <button type="submit" className="addMintItem">
              Add/Mint Item
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default addItem;
